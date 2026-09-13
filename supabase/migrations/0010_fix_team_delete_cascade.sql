-- ============================================================================
-- SBC Hub · 0010 let a team be deleted with its roster
--
-- Deleting a team cascades to its members. guard_locked_roster() fires once
-- per member row, looks up the team to see whether it is editable, finds the
-- team already gone, treats "not found" as "not editable" and raises
-- ROSTER_LOCKED — so no team with players could ever be deleted.
--
-- Two rules, matching 0009:
--   * no signed-in user means the auth service, a cascade or a scheduled job,
--     not a manager — step aside. Anonymous clients hold no write grant on
--     team_members; their only path in is submit_player(), which checks the
--     lock itself before inserting.
--   * a member whose team no longer exists is being removed with it.
-- ============================================================================

create or replace function public.guard_locked_roster() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  tid uuid := coalesce(new.team_id, old.team_id);
begin
  if auth.uid() is null then return coalesce(new, old); end if;
  if public.is_admin() then return coalesce(new, old); end if;

  if tg_op = 'DELETE' and not exists (select 1 from teams where id = tid) then
    return old;
  end if;

  if not public.team_editable(tid) then
    raise exception 'ROSTER_LOCKED' using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;

revoke all on function public.guard_locked_roster() from public, anon, authenticated;
