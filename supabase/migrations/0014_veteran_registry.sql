-- ============================================================================
-- SBC Hub · 0014 past-player registry that the fee can rely on
--
-- 1. apply_veteran_status() read new.ic_norm in a BEFORE trigger. ic_norm is a
--    generated column and is not computed until after BEFORE triggers run, so
--    it was always NULL on insert: a past player signing up AFTER being keyed
--    into the registry was never recognised, and their team could get the
--    all-new RM120 fee. The digits are now computed from ic_no directly.
--
-- 2. "Played before" means a season other than this competition's own. That
--    lets the organiser save this season's players into the registry without
--    turning this season's teams into returning teams.
--
-- 3. Removing someone from the registry, or correcting their IC or seasons,
--    re-evaluates every roster row that referenced them. Before, only an
--    insert had any effect.
--
-- 4. Only an organiser can set new_player_src = 'admin'. A manager sending it
--    is treated as a self-declaration, so the registry still applies.
--
-- 5. upsert_veterans() and archive_season() for bulk paste and end-of-season.
--    Both run as the caller and check for a super organiser.
-- ============================================================================

create or replace function public.is_veteran_for(p_ic text, p_competition uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from veteran_players v
     where v.ic_norm = p_ic
       and (
         cardinality(v.seasons) = 0
         or exists (
           select 1 from unnest(v.seasons) s
            where upper(s) <> upper((select season from competitions where id = p_competition))
         )
       )
  );
$$;

create or replace function public.apply_veteran_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ic text := regexp_replace(new.ic_no, '[^0-9]', '', 'g');
begin
  if new.new_player_src = 'admin' then
    if auth.uid() is null or public.is_admin() then
      return new;                                  -- organiser override wins
    end if;
    if tg_op = 'UPDATE' and old.new_player_src = 'admin'
       and new.is_new_player = old.is_new_player then
      return new;                                  -- manager editing other fields
    end if;
    new.new_player_src := 'self';                  -- managers cannot claim it
  end if;

  if public.is_veteran_for(ic, new.competition_id) then
    new.is_new_player  := false;
    new.new_player_src := 'registry';
  elsif new.new_player_src = 'registry' then
    new.is_new_player  := true;                    -- IC corrected away from a match
    new.new_player_src := 'self';
  end if;
  return new;
end $$;

drop trigger if exists team_members_veteran on team_members;
create trigger team_members_veteran
  before insert or update of ic_no, new_player_src, is_new_player on team_members
  for each row execute function public.apply_veteran_status();

-- Re-evaluate every non-override roster row for one IC.
create or replace function public.reapply_veteran(p_ic text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update team_members m
     set is_new_player = false, new_player_src = 'registry'
   where m.ic_norm = p_ic
     and m.new_player_src <> 'admin'
     and (m.is_new_player or m.new_player_src <> 'registry')
     and public.is_veteran_for(p_ic, m.competition_id);

  update team_members m
     set is_new_player = true, new_player_src = 'self'
   where m.ic_norm = p_ic
     and m.new_player_src = 'registry'
     and not public.is_veteran_for(p_ic, m.competition_id);
end $$;

create or replace function public.backfill_veteran() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.reapply_veteran(old.ic_norm);
  end if;
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.ic_norm <> old.ic_norm) then
    perform public.reapply_veteran(new.ic_norm);
  end if;
  return null;
end $$;

drop trigger if exists veteran_players_backfill on veteran_players;
create trigger veteran_players_backfill
  after insert or update of ic_norm, seasons or delete on veteran_players
  for each row execute function public.backfill_veteran();

-- Bulk paste. p_rows: [{ "ic": "...", "name": "...", "seasons": ["25S1"], "note": "" }]
-- Seasons are merged, never replaced, so pasting the same sheet twice is safe.
create or replace function public.upsert_veterans(p_rows jsonb)
returns table (added int, updated int)
language plpgsql security invoker set search_path = public as $$
declare
  r      jsonb;
  ic     text;
  n_add  int := 0;
  n_upd  int := 0;
  seas   text[];
  was    boolean;
begin
  if not public.has_admin_role('super') then
    raise exception 'FORBIDDEN' using errcode = 'insufficient_privilege';
  end if;

  for r in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    ic := regexp_replace(coalesce(r->>'ic', ''), '[^0-9]', '', 'g');
    continue when ic !~ '^[0-9]{6,14}$' or length(btrim(coalesce(r->>'name', ''))) < 2;

    seas := array(
      select distinct upper(btrim(s))
        from jsonb_array_elements_text(coalesce(r->'seasons', '[]'::jsonb)) s
       where btrim(s) <> ''
    );

    was := exists (select 1 from veteran_players where ic_norm = ic);

    insert into veteran_players (ic_norm, full_name, seasons, note, created_by)
    values (ic, btrim(r->>'name'), seas, coalesce(r->>'note', ''), auth.uid())
    on conflict (ic_norm) do update
       set full_name = excluded.full_name,
           seasons   = array(select distinct x from unnest(veteran_players.seasons || excluded.seasons) x order by 1),
           note      = case when excluded.note = '' then veteran_players.note else excluded.note end;

    if was then n_upd := n_upd + 1; else n_add := n_add + 1; end if;
  end loop;

  return query select n_add, n_upd;
end $$;

-- End of season: every confirmed player of one competition joins the registry.
create or replace function public.archive_season(p_competition uuid)
returns table (added int, updated int)
language plpgsql security invoker set search_path = public as $$
declare
  payload jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
           'ic', m.ic_norm, 'name', m.full_name, 'seasons', jsonb_build_array(c.season))), '[]')
    into payload
    from team_members m
    join competitions c on c.id = m.competition_id
   where m.competition_id = p_competition
     and m.status = 'active'
     and m.is_player;

  return query select * from public.upsert_veterans(payload);
end $$;

revoke all on function public.is_veteran_for(text, uuid)   from public, anon, authenticated;
revoke all on function public.reapply_veteran(text)         from public, anon, authenticated;
revoke all on function public.backfill_veteran()            from public, anon, authenticated;
revoke all on function public.apply_veteran_status()        from public, anon, authenticated;
revoke all on function public.upsert_veterans(jsonb)        from public, anon;
revoke all on function public.archive_season(uuid)          from public, anon;
grant execute on function public.upsert_veterans(jsonb)     to authenticated;
grant execute on function public.archive_season(uuid)       to authenticated;
