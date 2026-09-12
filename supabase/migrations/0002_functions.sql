-- ============================================================================
-- SBC Hub · 0002 functions, rules and public RPCs
-- ============================================================================

-- ------------------------------------------------------------- identity ----
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where id = auth.uid());
$$;

create or replace function public.has_admin_role(variadic wanted admin_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where id = auth.uid() and role = any(wanted));
$$;

-- super admins can do everything; scoped admins only their own area
create or replace function public.can_finance() returns boolean
language sql stable as $$ select public.has_admin_role('super','finance'); $$;

create or replace function public.can_fixtures() returns boolean
language sql stable as $$ select public.has_admin_role('super','fixtures'); $$;

create or replace function public.manages_team(p_team uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from teams
     where id = p_team
       and manager_user_id = auth.uid()
       and manager_status = 'active'
  );
$$;

create or replace function public.team_editable(p_team uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select locked_at is null or (edit_window_until is not null and edit_window_until > now())
       from teams where id = p_team),
    false);
$$;

-- On first Google sign-in: promote pre-authorised admins, and bind a manager
-- account to the team that was created for that email.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare
  inv admin_invites%rowtype;
begin
  select * into inv from admin_invites where email = new.email and claimed_at is null;

  if found then
    insert into admins (id, email, full_name, role)
    values (new.id, new.email,
            coalesce(nullif(inv.full_name,''), new.raw_user_meta_data->>'full_name', ''),
            inv.role)
    on conflict (id) do nothing;
    update admin_invites set claimed_at = now() where email = new.email;
  end if;

  update teams
     set manager_user_id = new.id,
         manager_status  = case when manager_status = 'invited' then 'active' else manager_status end
   where manager_email = new.email
     and manager_user_id is null;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------ veteran registry ---
-- The registry is the source of truth. A player ticking "I'm new" cannot
-- override a match; an admin can (new_player_src = 'admin').
create or replace function public.apply_veteran_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.new_player_src = 'admin' then
    return new;                                  -- explicit admin override wins
  end if;

  if exists (select 1 from veteran_players v where v.ic_norm = new.ic_norm) then
    new.is_new_player  := false;
    new.new_player_src := 'registry';
  end if;

  return new;
end $$;

create trigger team_members_veteran
  before insert or update of ic_no, new_player_src on team_members
  for each row execute function public.apply_veteran_status();

-- Adding someone to the registry retro-fixes any roster already referencing
-- them, so a late import still corrects the fee.
create or replace function public.backfill_veteran() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update team_members
     set is_new_player = false, new_player_src = 'registry'
   where ic_norm = new.ic_norm
     and new_player_src <> 'admin'
     and is_new_player;
  return new;
end $$;

create trigger veteran_players_backfill
  after insert on veteran_players
  for each row execute function public.backfill_veteran();

-- ------------------------------------------------------------ roster maths -
create or replace function public.roster_counts(p_team uuid)
returns table (players int, coaches int, managers int, masiswa int, state int, all_new boolean)
language sql stable security definer set search_path = public as $$
  select
    count(*) filter (where is_player)::int,
    count(*) filter (where is_coach)::int,
    count(*) filter (where is_manager)::int,
    count(*) filter (where tier in ('masiswa','state'))::int,
    count(*) filter (where tier = 'state')::int,
    coalesce(bool_and(is_new_player) filter (where is_player), false)
  from team_members
 where team_id = p_team and status = 'active';
$$;

-- Fee is derived, never entered. -1 tier = whole team is new.
create or replace function public.team_fee(p_team uuid)
returns table (tier_key text, base_cents int, deposit_cents int, total_cents int)
language plpgsql stable security definer set search_path = public as $$
declare
  c        competitions%rowtype;
  r        record;
  tier     fee_tiers%rowtype;
begin
  select cp.* into c from competitions cp
    join teams t on t.competition_id = cp.id where t.id = p_team;
  select * into r from public.roster_counts(p_team);

  if r.all_new and r.players > 0 then
    select * into tier from fee_tiers
     where competition_id = c.id and masiswa_count = -1;
  end if;

  if tier.id is null then
    select * into tier from fee_tiers
     where competition_id = c.id
       and masiswa_count = least(r.masiswa, (select max(masiswa_count) from fee_tiers where competition_id = c.id));
  end if;

  return query select coalesce(tier.key,'unknown'),
                      coalesce(tier.amount_cents,0),
                      c.deposit_cents,
                      coalesce(tier.amount_cents,0) + c.deposit_cents;
end $$;

-- Keep payments.* in step with the roster so an approved amount always
-- matches what the bank actually received.
create or replace function public.refresh_team_fee(p_team uuid) returns void
language plpgsql security definer set search_path = public as $$
declare f record;
begin
  select * into f from public.team_fee(p_team);
  insert into payments (team_id, tier_key, base_cents, deposit_cents)
  values (p_team, f.tier_key, f.base_cents, f.deposit_cents)
  on conflict (team_id) do update
    set tier_key      = excluded.tier_key,
        base_cents    = excluded.base_cents,
        deposit_cents = excluded.deposit_cents
  where payments.status in ('none','rejected');   -- never move an amount under review
end $$;

create or replace function public.on_roster_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_team_fee(coalesce(new.team_id, old.team_id));
  return coalesce(new, old);
end $$;

create trigger team_members_fee
  after insert or update or delete on team_members
  for each row execute function public.on_roster_change();

-- -------------------------------------------------------- roster limits ----
create or replace function public.enforce_roster_rules() returns trigger
language plpgsql security definer set search_path = public as $$
declare c competitions%rowtype; r record;
begin
  if new.status <> 'active' then return new; end if;

  select cp.* into c from competitions cp
    join teams t on t.competition_id = cp.id where t.id = new.team_id;
  select * into r from public.roster_counts(new.team_id);

  if r.masiswa > c.max_masiswa then
    raise exception 'MASISWA_QUOTA: % of max %', r.masiswa, c.max_masiswa
      using errcode = 'check_violation';
  end if;
  if r.state > c.max_state then
    raise exception 'STATE_QUOTA: % of max %', r.state, c.max_state
      using errcode = 'check_violation';
  end if;
  if r.players > c.roster_max then
    raise exception 'ROSTER_FULL: % of max %', r.players, c.roster_max
      using errcode = 'check_violation';
  end if;
  if r.coaches > c.max_coaches then
    raise exception 'COACH_QUOTA: max %', c.max_coaches using errcode = 'check_violation';
  end if;
  if r.managers > c.max_managers then
    raise exception 'MANAGER_QUOTA: max %', c.max_managers using errcode = 'check_violation';
  end if;

  return new;
end $$;

create constraint trigger team_members_rules
  after insert or update on team_members
  deferrable initially immediate
  for each row execute function public.enforce_roster_rules();

-- Locked rosters are read-only unless an admin opened an edit window.
create or replace function public.guard_locked_roster() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return coalesce(new, old); end if;
  if not public.team_editable(coalesce(new.team_id, old.team_id)) then
    raise exception 'ROSTER_LOCKED' using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;

create trigger team_members_locked
  before insert or update or delete on team_members
  for each row execute function public.guard_locked_roster();

-- ------------------------------------------------------- jersey colours ----
create or replace function public.colour_distance(a text, b text) returns numeric
language plpgsql immutable as $$
declare ar int; ag int; ab int; br int; bg int; bb int;
begin
  ar := ('x'||substr(a,2,2))::bit(8)::int; ag := ('x'||substr(a,4,2))::bit(8)::int; ab := ('x'||substr(a,6,2))::bit(8)::int;
  br := ('x'||substr(b,2,2))::bit(8)::int; bg := ('x'||substr(b,4,2))::bit(8)::int; bb := ('x'||substr(b,6,2))::bit(8)::int;
  -- weighted toward green, which the eye resolves best
  return sqrt(0.55*power(ar-br,2) + 0.70*power(ag-bg,2) + 0.35*power(ab-bb,2));
end $$;

create or replace function public.enforce_colour_distance() returns trigger
language plpgsql security definer set search_path = public as $$
declare c competitions%rowtype; clash record;
begin
  if new.status = 'rejected' then return new; end if;

  select * into c from competitions where id = new.competition_id;

  select jc.team_id, jc.hex, jc.name_en, t.name as team_name
    into clash
    from jersey_colours jc join teams t on t.id = jc.team_id
   where jc.competition_id = new.competition_id
     and jc.team_id <> new.team_id
     and jc.status <> 'rejected'
     and public.colour_distance(jc.hex, new.hex) < c.min_colour_distance
   order by jc.claimed_at
   limit 1;

  if found then
    raise exception 'COLOUR_TOO_CLOSE: % (%) already taken by %', clash.name_en, clash.hex, clash.team_name
      using errcode = 'unique_violation';
  end if;

  return new;
end $$;

create trigger jersey_colours_distance
  before insert or update of hex, status on jersey_colours
  for each row execute function public.enforce_colour_distance();

-- Colour selection only opens once the fee is approved (T&C 8).
create or replace function public.guard_colour_gate() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if not exists (select 1 from payments where team_id = new.team_id and status = 'approved') then
    raise exception 'PAYMENT_NOT_APPROVED' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger jersey_colours_gate
  before insert on jersey_colours
  for each row execute function public.guard_colour_gate();

-- =====================  public (no login) player link  ======================

-- What the player form needs in order to validate as the person types.
-- Deliberately returns no personal data about anybody else.
create or replace function public.invite_context(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare l invite_links%rowtype; t teams%rowtype; c competitions%rowtype; r record;
begin
  select * into l from invite_links where token = p_token;
  if not found then return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND'); end if;
  if l.revoked_at is not null then return jsonb_build_object('ok', false, 'reason', 'REVOKED'); end if;
  if l.expires_at is not null and l.expires_at < now() then
    return jsonb_build_object('ok', false, 'reason', 'EXPIRED'); end if;
  if l.max_uses is not null and l.uses >= l.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'USED'); end if;

  select * into t from teams where id = l.team_id;
  select * into c from competitions where id = t.competition_id;
  if not public.team_editable(t.id) then
    return jsonb_build_object('ok', false, 'reason', 'ROSTER_LOCKED'); end if;

  select * into r from public.roster_counts(t.id);

  return jsonb_build_object(
    'ok', true,
    'team',        jsonb_build_object('name', t.name, 'crest', t.crest_color, 'logo', t.logo_path),
    'competition', jsonb_build_object('name_en', c.name_en, 'name_zh', c.name_zh,
                                      'deadline', c.registration_deadline,
                                      'starts_on', c.starts_on, 'ends_on', c.ends_on),
    'rules',       jsonb_build_object('max_masiswa', c.max_masiswa, 'max_state', c.max_state,
                                      'roster_max', c.roster_max),
    'used',        jsonb_build_object('masiswa', r.masiswa, 'state', r.state, 'players', r.players),
    -- taken numbers/names so the form can warn before submit; no names attached
    'taken_numbers', coalesce((select jsonb_agg(jersey_no order by jersey_no) from team_members
                                where team_id = t.id and status <> 'declined' and jersey_no is not null), '[]'::jsonb),
    'taken_jersey_names', coalesce((select jsonb_agg(upper(jersey_name)) from team_members
                                where team_id = t.id and status <> 'declined' and jersey_name is not null), '[]'::jsonb),
    'sizes', jsonb_build_array('XS','S','M','L','XL','2XL','3XL')
  );
end $$;

-- The only write path available to an anonymous visitor.
create or replace function public.submit_player(p_token text, p jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare l invite_links%rowtype; t teams%rowtype; ic text; new_id uuid;
begin
  select * into l from invite_links where token = p_token for update;
  if not found or l.revoked_at is not null
     or (l.expires_at is not null and l.expires_at < now())
     or (l.max_uses is not null and l.uses >= l.max_uses) then
    return jsonb_build_object('ok', false, 'error', 'LINK_INVALID');
  end if;

  select * into t from teams where id = l.team_id;
  if not public.team_editable(t.id) then
    return jsonb_build_object('ok', false, 'error', 'ROSTER_LOCKED');
  end if;

  ic := regexp_replace(coalesce(p->>'ic_no',''), '[^0-9]', '', 'g');
  if length(ic) < 6 then return jsonb_build_object('ok', false, 'error', 'IC_INVALID'); end if;

  begin
    insert into team_members (
      team_id, competition_id, full_name, ic_no, phone, student_id, course, study_year,
      jersey_no, jersey_name, jersey_size, tier, is_player,
      is_new_player, new_player_src, photo_path, status, invite_link_id
    ) values (
      t.id, t.competition_id,
      btrim(p->>'full_name'), p->>'ic_no', coalesce(p->>'phone',''),
      coalesce(p->>'student_id',''), coalesce(p->>'course',''), coalesce(p->>'study_year',''),
      (p->>'jersey_no')::int, upper(btrim(p->>'jersey_name')), p->>'jersey_size',
      coalesce((p->>'tier')::player_tier, 'none'), true,
      coalesce((p->>'is_new_player')::boolean, true), 'self',
      p->>'photo_path', 'pending', l.id
    ) returning id into new_id;
  exception
    when unique_violation then
      -- surface which rule was hit so the form can point at the right field
      return jsonb_build_object('ok', false, 'error',
        case
          when sqlerrm like '%tm_one_person_per_comp%'  then 'IC_ALREADY_REGISTERED'
          when sqlerrm like '%tm_jersey_no_uniq%'       then 'JERSEY_NO_TAKEN'
          when sqlerrm like '%tm_jersey_name_uniq%'     then 'JERSEY_NAME_TAKEN'
          else 'DUPLICATE' end);
    when check_violation then
      return jsonb_build_object('ok', false, 'error', split_part(sqlerrm, ':', 1));
  end;

  update invite_links set uses = uses + 1 where id = l.id;

  return jsonb_build_object('ok', true, 'id', new_id, 'team', t.name);
end $$;

-- Public fixtures view: schedule only, never personal data.
create or replace view public.public_fixtures
with (security_invoker = off) as
  select m.id, c.slug as competition, m.round, m.ord, m.scheduled_at, m.court,
         s.name_en as stage_en, s.name_zh as stage_zh,
         g.name as group_name,
         ht.name as home_team, ht.crest_color as home_crest, ht.logo_path as home_logo,
         at.name as away_team, at.crest_color as away_crest, at.logo_path as away_logo,
         m.home_label_en, m.home_label_zh, m.away_label_en, m.away_label_zh
    from matches m
    join competitions c on c.id = m.competition_id
    left join stages s on s.id = m.stage_id
    left join groups g on g.id = m.group_id
    left join teams ht on ht.id = m.home_team_id
    left join teams at on at.id = m.away_team_id
   where c.status in ('locked','running','finished');
