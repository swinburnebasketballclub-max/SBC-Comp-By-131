-- ============================================================================
-- SBC Hub · 0003 row level security
--
-- Who can see what, enforced by Postgres rather than by the UI:
--   anon           nothing, except two RPCs and the public fixtures view
--   manager        only their own team; full IC only for their own players
--   admin/finance  payments and refunds
--   admin/fixtures stages, groups and matches
--   admin/super    everything
-- ============================================================================

alter table admins          enable row level security;
alter table admin_invites   enable row level security;
alter table competitions    enable row level security;
alter table fee_tiers       enable row level security;
alter table terms           enable row level security;
alter table veteran_players enable row level security;
alter table teams           enable row level security;
alter table team_members    enable row level security;
alter table invite_links    enable row level security;
alter table payments        enable row level security;
alter table jersey_colours  enable row level security;
alter table stages          enable row level security;
alter table groups          enable row level security;
alter table group_teams     enable row level security;
alter table matches         enable row level security;
alter table audit_log       enable row level security;

-- nothing is readable by default
revoke all on all tables in schema public from anon, authenticated;

-- ------------------------------------------------------------- identity ----
grant select on admins to authenticated;
create policy admins_read on admins for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy admins_write on admins for all to authenticated
  using (public.has_admin_role('super')) with check (public.has_admin_role('super'));

grant select, insert, update, delete on admin_invites to authenticated;
create policy admin_invites_super on admin_invites for all to authenticated
  using (public.has_admin_role('super')) with check (public.has_admin_role('super'));

-- --------------------------------------------------------- competitions ----
grant select on competitions, fee_tiers, terms to authenticated;
create policy comp_read      on competitions for select to authenticated using (true);
create policy fee_tiers_read on fee_tiers    for select to authenticated using (true);
create policy terms_read     on terms        for select to authenticated using (true);

grant insert, update, delete on competitions, fee_tiers, terms to authenticated;
create policy comp_write      on competitions for all to authenticated
  using (public.has_admin_role('super')) with check (public.has_admin_role('super'));
create policy fee_tiers_write on fee_tiers    for all to authenticated
  using (public.has_admin_role('super')) with check (public.has_admin_role('super'));
create policy terms_write     on terms        for all to authenticated
  using (public.has_admin_role('super')) with check (public.has_admin_role('super'));

-- ------------------------------------------------------ veteran registry ---
-- every admin may read it (they need it to explain a fee); super may edit
grant select, insert, update, delete on veteran_players to authenticated;
create policy veterans_read on veteran_players for select to authenticated
  using (public.is_admin());
create policy veterans_write on veteran_players for all to authenticated
  using (public.has_admin_role('super')) with check (public.has_admin_role('super'));

-- ----------------------------------------------------------------- teams ---
grant select on teams to authenticated;
-- a manager sees their own team; admins see all
create policy teams_read on teams for select to authenticated
  using (public.is_admin() or manager_user_id = auth.uid());

grant insert, delete on teams to authenticated;
create policy teams_admin_write on teams for insert to authenticated
  with check (public.has_admin_role('super'));
create policy teams_admin_delete on teams for delete to authenticated
  using (public.has_admin_role('super'));

-- Admins may change anything on a team; managers only these columns.
grant update on teams to authenticated;
create policy teams_admin_update on teams for update to authenticated
  using (public.has_admin_role('super')) with check (public.has_admin_role('super'));
create policy teams_manager_update on teams for update to authenticated
  using (manager_user_id = auth.uid() and public.team_editable(id))
  with check (manager_user_id = auth.uid());

-- Column-level guard: even inside the policy above, a manager cannot rename
-- their team, promote themselves, or unlock their own roster.
create or replace function public.guard_team_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if new.name            is distinct from old.name
  or new.competition_id  is distinct from old.competition_id
  or new.manager_email   is distinct from old.manager_email
  or new.manager_user_id is distinct from old.manager_user_id
  or new.manager_status  is distinct from old.manager_status
  or new.locked_at       is distinct from old.locked_at
  or new.edit_window_until is distinct from old.edit_window_until then
    raise exception 'FIELD_ADMIN_ONLY' using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

create trigger teams_guard_columns
  before update on teams
  for each row execute function public.guard_team_columns();

-- --------------------------------------------------------- team members ----
grant select, insert, update, delete on team_members to authenticated;

create policy members_read on team_members for select to authenticated
  using (public.is_admin() or public.manages_team(team_id));

create policy members_manager_write on team_members for all to authenticated
  using (public.manages_team(team_id))
  with check (public.manages_team(team_id));

create policy members_admin_write on team_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------- invite links ---
grant select, insert, update, delete on invite_links to authenticated;
create policy invites_read on invite_links for select to authenticated
  using (public.is_admin() or public.manages_team(team_id));
create policy invites_write on invite_links for all to authenticated
  using (public.is_admin() or public.manages_team(team_id))
  with check (public.is_admin() or public.manages_team(team_id));

-- --------------------------------------------------------------- payment ---
grant select on payments to authenticated;
create policy payments_read on payments for select to authenticated
  using (public.is_admin() or public.manages_team(team_id));

-- managers submit a reference, a receipt and their refund account — nothing else
grant update (reference_no, receipt_path, refund_bank, refund_holder,
              refund_account, refund_saved_at, submitted_at, status) on payments to authenticated;
create policy payments_manager_update on payments for update to authenticated
  using (public.manages_team(team_id) and status in ('none','rejected'))
  with check (public.manages_team(team_id) and status in ('none','pending'));

grant insert, update, delete on payments to authenticated;
create policy payments_finance on payments for all to authenticated
  using (public.can_finance()) with check (public.can_finance());

-- --------------------------------------------------------- jersey colour ---
grant select on jersey_colours to authenticated;
-- every team can see which colours are gone — that is the point of first-come
create policy colours_read on jersey_colours for select to authenticated using (true);

grant insert, update on jersey_colours to authenticated;
create policy colours_manager_claim on jersey_colours for insert to authenticated
  with check (public.manages_team(team_id));
create policy colours_manager_design on jersey_colours for update to authenticated
  using (public.manages_team(team_id) and status = 'pending')
  with check (public.manages_team(team_id));

grant delete on jersey_colours to authenticated;
create policy colours_admin on jersey_colours for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------- fixtures ----
grant select on stages, groups, group_teams, matches to authenticated;
create policy stages_read      on stages      for select to authenticated using (true);
create policy groups_read      on groups      for select to authenticated using (true);
create policy group_teams_read on group_teams for select to authenticated using (true);
create policy matches_read     on matches     for select to authenticated using (true);

grant insert, update, delete on stages, groups, group_teams, matches to authenticated;
create policy stages_write      on stages      for all to authenticated
  using (public.can_fixtures()) with check (public.can_fixtures());
create policy groups_write      on groups      for all to authenticated
  using (public.can_fixtures()) with check (public.can_fixtures());
create policy group_teams_write on group_teams for all to authenticated
  using (public.can_fixtures()) with check (public.can_fixtures());
create policy matches_write     on matches     for all to authenticated
  using (public.can_fixtures()) with check (public.can_fixtures());

-- ------------------------------------------------------------- audit log ---
grant select on audit_log to authenticated;
create policy audit_read on audit_log for select to authenticated using (public.is_admin());

-- ============================  anonymous access  ============================
-- Two functions and one view. No table is reachable without a login.
grant usage on schema public to anon;
grant execute on function public.invite_context(text) to anon, authenticated;
grant execute on function public.submit_player(text, jsonb) to anon, authenticated;
grant select on public.public_fixtures to anon, authenticated;

-- keep new objects locked down by default
alter default privileges in schema public revoke all on tables from anon, authenticated;
