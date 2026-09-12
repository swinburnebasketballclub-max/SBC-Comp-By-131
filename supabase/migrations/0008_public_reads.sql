-- ============================================================================
-- SBC Hub · 0008 what an anonymous visitor may read
--
-- Until now every table was closed to `anon`, so the landing page and the
-- public schedule rendered empty for anyone not signed in — which is most
-- people. This opens exactly three things, and only once a competition has
-- left draft:
--
--   competitions  the details already printed on the registration form
--   terms         the clauses players agree to
--   fee_tiers     the entry fee bands
--
-- Column-level grants keep the bank account and contact number out of it;
-- those belong to signed-in managers only.
-- ============================================================================

-- Rows: published competitions only. A draft stays invisible.
create policy comp_read_public on competitions for select to anon
  using (status <> 'draft');

create policy terms_read_public on terms for select to anon
  using (exists (
    select 1 from competitions c
     where c.id = terms.competition_id and c.status <> 'draft'));

create policy fee_tiers_read_public on fee_tiers for select to anon
  using (exists (
    select 1 from competitions c
     where c.id = fee_tiers.competition_id and c.status <> 'draft'));

-- Columns: everything that is already public on the registration form.
-- Deliberately excluded: bank_name, bank_holder, bank_account, bank_whatsapp,
-- bank_qr_path, created_by, created_at.
grant select (
  id, slug, name_en, name_zh, season,
  venue_en, venue_zh,
  starts_on, ends_on, registration_deadline, status,
  max_teams, roster_min, roster_max, max_coaches, max_managers,
  max_masiswa, max_state, deposit_cents,
  daily_start, daily_end, match_minutes, courts
) on competitions to anon;

grant select (id, competition_id, idx, body_en, body_zh) on terms to anon;

grant select (id, competition_id, key, masiswa_count, label_en, label_zh, amount_cents, sort)
  on fee_tiers to anon;
