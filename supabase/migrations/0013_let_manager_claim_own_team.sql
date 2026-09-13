-- ============================================================================
-- SBC Hub · 0013 let a signed-in manager claim the team registered to them
--
-- claim_pending_access() (0012) binds a team to a manager who had already
-- signed in before the team was registered. That UPDATE runs with the
-- manager's own session, so guard_team_columns() sees a non-organiser
-- changing manager_user_id and refuses it.
--
-- The one change a manager may make to those columns is claiming a team that
-- is registered to their own email and not yet claimed by anyone — binding
-- themselves, activating the invite, and touching nothing else.
-- ============================================================================

create or replace function public.guard_team_columns() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare
  me uuid := auth.uid();
begin
  if me is null then return new; end if;           -- auth service / system trigger
  if public.is_admin() then return new; end if;

  -- claiming your own, unclaimed team
  if old.manager_user_id is null
     and new.manager_user_id = me
     and new.manager_email = (select email from auth.users where id = me)
     and new.manager_email     = old.manager_email
     and new.name              = old.name
     and new.competition_id    = old.competition_id
     and new.locked_at         is not distinct from old.locked_at
     and new.edit_window_until is not distinct from old.edit_window_until
     and new.manager_status in (old.manager_status, 'active') then
    return new;
  end if;

  if new.name              is distinct from old.name
  or new.competition_id    is distinct from old.competition_id
  or new.manager_email     is distinct from old.manager_email
  or new.manager_user_id   is distinct from old.manager_user_id
  or new.manager_status    is distinct from old.manager_status
  or new.locked_at         is distinct from old.locked_at
  or new.edit_window_until is distinct from old.edit_window_until then
    raise exception 'FIELD_ADMIN_ONLY' using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

revoke all on function public.guard_team_columns() from public, anon, authenticated;
