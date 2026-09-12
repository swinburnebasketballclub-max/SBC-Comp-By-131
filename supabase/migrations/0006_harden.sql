-- ============================================================================
-- SBC Hub · 0006 hardening
--
-- Fixes raised by the Supabase database linter after 0001–0005:
--   * every function pinned to an explicit search_path
--   * SECURITY DEFINER helpers no longer callable over the REST API, except
--     the three that are deliberately public
--   * the public fixtures view replaced by a function, so anonymous visitors
--     get chosen columns instead of a definer view over the whole table
-- ============================================================================

-- -------------------------------------------------- pin every search_path --
alter function public.team_is_editable(teams)        set search_path = public;
alter function public.touch_updated_at()             set search_path = public;
alter function public.sync_member_competition()      set search_path = public;
alter function public.can_finance()                  set search_path = public;
alter function public.can_fixtures()                 set search_path = public;
alter function public.colour_distance(text, text)    set search_path = public;
alter function public.storage_team_id(text)          set search_path = public;

-- ------------------------------------------- fixtures for anonymous eyes ---
-- A view marked SECURITY DEFINER exposes every column it selects over the
-- REST API. A function returns only what it declares, which is what we want:
-- schedule, venue and crests — never a player, never a manager's email.
drop view if exists public.public_fixtures;

create or replace function public.get_fixtures(p_slug text)
returns table (
  match_id      uuid,
  round         int,
  ord           int,
  scheduled_at  timestamptz,
  court         int,
  stage_en      text,
  stage_zh      text,
  group_name    text,
  home_team     text,
  home_crest    text,
  home_logo     text,
  away_team     text,
  away_crest    text,
  away_logo     text,
  home_label_en text,
  home_label_zh text,
  away_label_en text,
  away_label_zh text
)
language sql stable security definer set search_path = public as $$
  select m.id, m.round, m.ord, m.scheduled_at, m.court,
         s.name_en, s.name_zh, g.name,
         ht.name, ht.crest_color, ht.logo_path,
         at.name, at.crest_color, at.logo_path,
         m.home_label_en, m.home_label_zh, m.away_label_en, m.away_label_zh
    from matches m
    join competitions c on c.id = m.competition_id
    left join stages s  on s.id = m.stage_id
    left join groups g  on g.id = m.group_id
    left join teams ht  on ht.id = m.home_team_id
    left join teams at  on at.id = m.away_team_id
   where c.slug = p_slug
     and c.status in ('locked','running','finished')
   order by m.scheduled_at nulls last, m.round, m.ord;
$$;

-- ------------------------------------------------ close the RPC surface ----
-- Trigger functions and internal helpers were reachable at /rest/v1/rpc/*.
-- Revoke everything, then hand back only what is actually needed.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prokind = 'f'
  loop
    execute format('revoke all on function %s from anon, authenticated', f.sig);
  end loop;
end $$;

-- Row level security policies call these, and a policy expression runs as the
-- querying role — so these must stay executable or every policy fails.
grant execute on function public.is_admin()                                   to authenticated;
grant execute on function public.has_admin_role(variadic admin_role[])        to authenticated;
grant execute on function public.manages_team(uuid)                           to authenticated;
grant execute on function public.team_editable(uuid)                          to authenticated;
grant execute on function public.can_finance()                                to authenticated;
grant execute on function public.can_fixtures()                               to authenticated;
grant execute on function public.owns_storage_object(text)                    to authenticated;

-- The three deliberately public entry points.
grant execute on function public.invite_context(text)        to anon, authenticated;
grant execute on function public.submit_player(text, jsonb)  to anon, authenticated;
grant execute on function public.get_fixtures(text)          to anon, authenticated;

-- Everything else — the trigger functions, team_fee, roster_counts,
-- refresh_team_fee, colour_distance — is now internal only.
