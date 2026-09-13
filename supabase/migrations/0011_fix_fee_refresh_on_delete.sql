-- ============================================================================
-- SBC Hub · 0011 do not recompute the fee of a team that is being deleted
--
-- Deleting a team cascades to its members, and each member delete fires
-- on_roster_change() → refresh_team_fee(). By then the team row is gone, so
-- team_fee() finds no competition, returns a null deposit, and the upsert
-- into payments fails its NOT NULL constraint — aborting the delete.
--
-- A team that no longer exists has no fee to keep in step.
-- ============================================================================

create or replace function public.refresh_team_fee(p_team uuid) returns void
language plpgsql security definer set search_path = public as $$
declare f record;
begin
  if not exists (select 1 from teams where id = p_team) then
    return;
  end if;

  select * into f from public.team_fee(p_team);
  insert into payments (team_id, tier_key, base_cents, deposit_cents)
  values (p_team, f.tier_key, f.base_cents, f.deposit_cents)
  on conflict (team_id) do update
    set tier_key      = excluded.tier_key,
        base_cents    = excluded.base_cents,
        deposit_cents = excluded.deposit_cents
  where payments.status in ('none', 'rejected');   -- never move an amount under review
end $$;

revoke all on function public.refresh_team_fee(uuid) from public, anon, authenticated;
grant execute on function public.refresh_team_fee(uuid) to service_role;
