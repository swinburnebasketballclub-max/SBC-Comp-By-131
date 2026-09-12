-- ============================================================================
-- SBC Hub · 0001 schema
-- Swinburne Basketball Club — competition registration & fixtures
--
-- Design rules encoded here (not in application code):
--   * one person cannot register for two teams in the same competition
--   * jersey number and jersey name are unique within a team
--   * one jersey colour per team, unique across the competition
--   * a team's fee is derived from its roster, never typed in by a manager
--   * "new player" status is decided by the veteran registry, not self-report
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------- enums ----
create type admin_role      as enum ('super', 'finance', 'fixtures');
create type comp_status     as enum ('draft', 'open', 'closed', 'locked', 'running', 'finished');
create type manager_status  as enum ('invited', 'active', 'disabled');
create type member_status   as enum ('pending', 'active', 'declined');
create type player_tier     as enum ('none', 'masiswa', 'state');
create type new_player_src  as enum ('registry', 'self', 'admin');
create type payment_status  as enum ('none', 'pending', 'approved', 'rejected');
create type colour_status   as enum ('pending', 'approved', 'rejected');
create type invite_kind     as enum ('shared', 'single');
create type stage_kind      as enum ('round_robin', 'group', 'knockout');

-- ---------------------------------------------------------------- admins ---
-- Seeded with the founding super admin; everyone else is added from the UI.
create table admins (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       citext not null unique,
  full_name   text   not null default '',
  role        admin_role not null default 'finance',
  created_at  timestamptz not null default now(),
  created_by  uuid references admins (id)
);

-- Pre-authorised admin emails. A row here lets that Google account become an
-- admin on first sign-in (handle_new_user below promotes them).
create table admin_invites (
  email       citext primary key,
  role        admin_role not null,
  full_name   text not null default '',
  invited_at  timestamptz not null default now(),
  invited_by  uuid references admins (id),
  claimed_at  timestamptz
);

-- ---------------------------------------------------------- competitions ---
create table competitions (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique,
  name_en                 text not null,
  name_zh                 text not null,
  season                  text not null,                 -- e.g. '26S2'
  venue_en                text not null default '',
  venue_zh                text not null default '',
  starts_on               date not null,
  ends_on                 date not null,
  registration_deadline   date not null,
  status                  comp_status not null default 'draft',

  -- roster rules (T&C 3–5)
  max_teams               int not null default 8  check (max_teams  between 2 and 64),
  roster_min              int not null default 8  check (roster_min between 1 and 30),
  roster_max              int not null default 12 check (roster_max >= roster_min),
  max_coaches             int not null default 1,
  max_managers            int not null default 1,
  max_masiswa             int not null default 3  check (max_masiswa >= 0),
  max_state               int not null default 1  check (max_state between 0 and max_masiswa),

  -- money, stored in sen (cents) to avoid float drift
  deposit_cents           int not null default 10000,

  -- fixtures defaults
  daily_start             time not null default '18:00',
  daily_end               time not null default '23:00',
  match_minutes           int  not null default 75 check (match_minutes > 0),
  courts                  int  not null default 1  check (courts > 0),

  -- jersey colour: minimum weighted RGB distance between any two teams
  min_colour_distance     numeric not null default 60,

  -- payee details shown to managers
  bank_name               text not null default '',
  bank_holder             text not null default '',
  bank_account            text not null default '',
  bank_whatsapp           text not null default '',
  bank_qr_path            text,

  -- auto-purge personal data this many days after ends_on (PDPA)
  purge_after_days        int not null default 90,

  created_at              timestamptz not null default now(),
  created_by              uuid references admins (id),
  check (ends_on >= starts_on),
  check (registration_deadline <= starts_on)
);

-- Fee tiers. `masiswa_count` = -1 marks the "whole team is new" tier, which
-- wins over every count-based tier.
create table fee_tiers (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid not null references competitions (id) on delete cascade,
  key             text not null,
  masiswa_count   int  not null,
  label_en        text not null,
  label_zh        text not null,
  amount_cents    int  not null check (amount_cents >= 0),
  sort            int  not null default 0,
  unique (competition_id, key),
  unique (competition_id, masiswa_count)
);

create table terms (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid not null references competitions (id) on delete cascade,
  idx             int  not null,
  body_en         text not null,
  body_zh         text not null,
  unique (competition_id, idx)
);

-- ----------------------------------------------------- veteran registry ----
-- Admin-maintained list of people who have played an SBC 5x5 tournament
-- before. Drives the "all new players" fee tier; grows every season.
create table veteran_players (
  id           uuid primary key default gen_random_uuid(),
  ic_norm      text not null unique check (ic_norm ~ '^[0-9]{6,14}$'),
  full_name    text not null,
  seasons      text[] not null default '{}',   -- e.g. {'25S1','25S2'}
  note         text not null default '',
  created_at   timestamptz not null default now(),
  created_by   uuid references admins (id)
);

create index veteran_players_name_idx on veteran_players using gin (to_tsvector('simple', full_name));

-- ----------------------------------------------------------------- teams ---
create table teams (
  id               uuid primary key default gen_random_uuid(),
  competition_id   uuid not null references competitions (id) on delete cascade,
  name             text not null check (length(btrim(name)) between 2 and 60),
  crest_color      text not null default '#E2578C' check (crest_color ~* '^#[0-9a-f]{6}$'),
  logo_path        text,

  manager_user_id  uuid references auth.users (id) on delete set null,
  manager_email    citext not null,
  manager_name     text not null default '',
  manager_status   manager_status not null default 'invited',
  invited_at       timestamptz not null default now(),

  captain_name     text not null default '',
  captain_whatsapp text not null default '',

  terms_accepted_at timestamptz,

  locked_at        timestamptz,
  edit_window_until timestamptz,

  created_at       timestamptz not null default now(),
  created_by       uuid references admins (id)
);

-- team name and manager account are unique per competition
create unique index teams_name_uniq    on teams (competition_id, lower(btrim(name)));
create unique index teams_manager_uniq on teams (competition_id, manager_email);
create index teams_manager_user_idx    on teams (manager_user_id);

-- A team may edit itself when it is not locked, or while an admin-granted
-- edit window is still open.
create or replace function team_is_editable(t teams) returns boolean
language sql stable as $$
  select t.locked_at is null
      or (t.edit_window_until is not null and t.edit_window_until > now());
$$;

-- --------------------------------------------------------- team members ----
create table team_members (
  id               uuid primary key default gen_random_uuid(),
  team_id          uuid not null references teams (id) on delete cascade,
  competition_id   uuid not null references competitions (id) on delete cascade,

  full_name        text not null check (length(btrim(full_name)) >= 2),
  ic_no            text not null,
  -- digits only, used for every uniqueness and veteran check
  ic_norm          text generated always as (regexp_replace(ic_no, '[^0-9]', '', 'g')) stored,
  phone            text not null default '',
  student_id       text not null default '',
  course           text not null default '',
  study_year       text not null default '',

  jersey_no        int  check (jersey_no between 0 and 99),
  jersey_name      text check (jersey_name ~ '^[A-Z0-9 .''-]{2,10}$'),
  jersey_size      text check (jersey_size in ('XS','S','M','L','XL','2XL','3XL')),

  tier             player_tier not null default 'none',
  is_manager       boolean not null default false,
  is_coach         boolean not null default false,
  is_captain       boolean not null default false,
  is_player        boolean not null default true,

  is_new_player    boolean not null default true,
  new_player_src   new_player_src not null default 'self',

  photo_path       text,
  status           member_status not null default 'pending',

  invite_link_id   uuid,
  submitted_at     timestamptz not null default now(),
  confirmed_at     timestamptz,
  confirmed_by     uuid references auth.users (id),

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- a coach who does not play needs no jersey; everyone else does
  check (not is_player or (jersey_no is not null and jersey_name is not null and jersey_size is not null)),
  check (ic_norm ~ '^[0-9]{6,14}$')
);

-- === the three rules that used to be checked by hand ======================
-- one person, one team, per competition (declined submissions don't count)
create unique index tm_one_person_per_comp
  on team_members (competition_id, ic_norm)
  where status <> 'declined';

-- jersey number unique inside a team
create unique index tm_jersey_no_uniq
  on team_members (team_id, jersey_no)
  where status <> 'declined' and jersey_no is not null;

-- jersey name unique inside a team
create unique index tm_jersey_name_uniq
  on team_members (team_id, upper(jersey_name))
  where status <> 'declined' and jersey_name is not null;
-- ==========================================================================

create index tm_team_idx   on team_members (team_id, status);
create index tm_comp_idx   on team_members (competition_id, status);
create index tm_name_idx   on team_members using gin (to_tsvector('simple', full_name));

-- ---------------------------------------------------------- invite links ---
create table invite_links (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams (id) on delete cascade,
  token       text not null unique check (token ~ '^[a-z0-9]{6,16}$'),
  kind        invite_kind not null default 'shared',
  label       text not null default '',
  max_uses    int,                                  -- null = unlimited
  uses        int not null default 0,
  expires_at  timestamptz,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id)
);

create index invite_links_team_idx on invite_links (team_id);

alter table team_members
  add constraint team_members_invite_fk
  foreign key (invite_link_id) references invite_links (id) on delete set null;

-- --------------------------------------------------------------- payment ---
create table payments (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null unique references teams (id) on delete cascade,

  tier_key        text,
  base_cents      int not null default 0,
  deposit_cents   int not null default 0,
  total_cents     int generated always as (base_cents + deposit_cents) stored,

  reference_no    text not null default '',
  receipt_path    text,
  status          payment_status not null default 'none',
  reject_reason   text not null default '',

  -- where the RM100 deposit gets refunded to
  refund_bank     text not null default '',
  refund_holder   text not null default '',
  refund_account  text not null default '',
  refund_saved_at timestamptz,

  submitted_at    timestamptz,
  reviewed_at     timestamptz,
  reviewed_by     uuid references auth.users (id)
);

-- --------------------------------------------------------- jersey colour ---
create table jersey_colours (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid not null references competitions (id) on delete cascade,
  team_id         uuid not null unique references teams (id) on delete cascade,
  hex             text not null check (hex ~* '^#[0-9a-f]{6}$'),
  name_en         text not null,
  name_zh         text not null default '',
  is_custom       boolean not null default false,
  design_path     text,
  design_note     text not null default '',
  claimed_at      timestamptz not null default now(),
  status          colour_status not null default 'pending',
  reviewed_at     timestamptz,
  reviewed_by     uuid references auth.users (id)
);

-- exact duplicates are impossible; near-duplicates are caught by a trigger
create unique index jersey_colour_uniq
  on jersey_colours (competition_id, lower(hex))
  where status <> 'rejected';

create index jersey_colour_order_idx on jersey_colours (competition_id, claimed_at);

-- ------------------------------------------------------------- fixtures ----
create table stages (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid not null references competitions (id) on delete cascade,
  kind            stage_kind not null,
  name_en         text not null,
  name_zh         text not null,
  sort            int not null default 0
);

create table groups (
  id        uuid primary key default gen_random_uuid(),
  stage_id  uuid not null references stages (id) on delete cascade,
  name      text not null,
  sort      int not null default 0
);

create table group_teams (
  group_id  uuid not null references groups (id) on delete cascade,
  team_id   uuid not null references teams (id) on delete cascade,
  seed      int not null default 0,
  primary key (group_id, team_id)
);

create table matches (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid not null references competitions (id) on delete cascade,
  stage_id        uuid references stages (id) on delete cascade,
  group_id        uuid references groups (id) on delete set null,
  round           int not null default 1,
  ord             int not null default 0,

  home_team_id    uuid references teams (id) on delete set null,
  away_team_id    uuid references teams (id) on delete set null,
  -- placeholders before qualifiers are known, e.g. 'A1' / 'Winner SF1'
  home_label_en   text not null default '',
  home_label_zh   text not null default '',
  away_label_en   text not null default '',
  away_label_zh   text not null default '',

  scheduled_at    timestamptz,
  court           int not null default 1,
  created_at      timestamptz not null default now(),
  check (home_team_id is null or home_team_id <> away_team_id)
);

create index matches_comp_idx on matches (competition_id, scheduled_at);

-- ------------------------------------------------------------- audit log ---
create table audit_log (
  id           bigserial primary key,
  actor_id     uuid,
  actor_email  citext,
  action       text not null,
  entity       text not null,
  entity_id    uuid,
  before       jsonb,
  after        jsonb,
  at           timestamptz not null default now()
);

create index audit_entity_idx on audit_log (entity, entity_id, at desc);

-- -------------------------------------------------------------- triggers ---
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger team_members_touch
  before update on team_members
  for each row execute function touch_updated_at();

-- Keep competition_id consistent with the parent team; no way to smuggle a
-- member into another competition's uniqueness scope.
create or replace function sync_member_competition() returns trigger
language plpgsql as $$
begin
  select competition_id into new.competition_id from teams where id = new.team_id;
  return new;
end $$;

create trigger team_members_sync_comp
  before insert or update of team_id on team_members
  for each row execute function sync_member_competition();
