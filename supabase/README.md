# Database

Four migrations, applied in order.

| File | What it holds |
|---|---|
| `0001_schema.sql` | Tables, enums, and the unique indexes that enforce the competition rules |
| `0002_functions.sql` | Fee calculation, veteran lookup, roster limits, colour distance, and the two public RPCs |
| `0003_rls.sql` | Row level security — who can read and write what |
| `0004_seed.sql` | SBC 26'S2 competition, fee tiers, bilingual T&C, founding super admin |

## Applying them

In the Supabase dashboard: **SQL Editor → New query**, paste each file in order and run.
(Once the CLI is set up, `supabase db push` does the same thing.)

## The rules that live in the database, not in the UI

These cannot be bypassed by a bug in the front end, a stale browser tab, or two
people clicking at the same moment.

| Rule | How it is enforced |
|---|---|
| One person cannot register for two teams | unique index on `(competition_id, ic_norm)` |
| Jersey number unique within a team | unique index on `(team_id, jersey_no)` |
| Jersey name unique within a team | unique index on `(team_id, upper(jersey_name))` |
| Max 3 Masiswa, of which max 1 State | `enforce_roster_rules` trigger |
| Roster size, one coach, one manager | same trigger |
| Jersey colour unique across the competition | unique index on `(competition_id, lower(hex))` |
| Two colours may not be near-identical | `enforce_colour_distance` trigger, weighted RGB |
| Colour selection opens only after payment is approved | `guard_colour_gate` trigger |
| A locked roster is read-only | `guard_locked_roster` trigger |
| A manager cannot rename their team or unlock it | `guard_team_columns` trigger |
| The fee is derived from the roster, never typed in | `team_fee()` + `refresh_team_fee()` |
| "New player" is decided by the registry, not self-report | `apply_veteran_status` trigger |

## Veteran registry

`veteran_players` is the list of people who have played an SBC 5x5 tournament
before. Admins key in past rosters by hand (or paste a batch).

When a player submits their details, their IC is matched against this table:

- **matched** → marked as a returning player automatically, whatever they ticked
- **no match** → treated as new, but an admin can override (`new_player_src = 'admin'`)

Adding someone to the registry later also corrects any roster already
referencing them, so a late import still fixes the fee.

## Anonymous access

Anonymous visitors reach exactly three things:

- `invite_context(token)` — what the player form needs to validate as someone
  types: team name, taken jersey numbers and names, remaining Masiswa quota.
  No personal data about anyone else.
- `submit_player(token, payload)` — the only write path without a login.
  Validates the token, inserts as `pending`, and returns a specific error code
  (`JERSEY_NO_TAKEN`, `IC_ALREADY_REGISTERED`, …) so the form can point at the
  right field.
- `public_fixtures` — schedule, teams, times and venue. Never personal data.

Every table is unreachable without a session.

## Personal data

`competitions.purge_after_days` (default 90) governs when IC numbers and
passport photos are cleared after the competition ends. The scheduled job that
does this is added in a later migration.
