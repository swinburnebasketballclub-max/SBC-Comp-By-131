-- ============================================================================
-- SBC Hub · 0009 let a manager's first sign-in bind them to their team
--
-- On a manager's first Google sign-in, handle_new_user() sets
-- teams.manager_user_id and manager_status. That UPDATE fires
-- guard_team_columns(), which refuses changes to those columns from anyone
-- who is not an organiser — and during sign-up there is no organiser session,
-- so the guard raised FIELD_ADMIN_ONLY and the whole sign-in failed.
--
-- Organiser sign-ins never hit this because no team carries their email.
--
-- The guard exists to stop a signed-in manager editing admin-only fields.
-- A write with no JWT at all is not a manager: it is the auth service or
-- another trusted server-side trigger (anonymous clients hold no UPDATE grant
-- on teams). So the guard now applies only when there is a signed-in user.
-- ============================================================================

create or replace function public.guard_team_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;   -- auth service / system trigger
  if public.is_admin() then return new; end if;

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
