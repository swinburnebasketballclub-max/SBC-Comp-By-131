# SBC Hub

Team registration and fixtures for Swinburne Basketball Club competitions.

Replaces the old flow — a Google Form, a Word roster passed around, and
WhatsApp chasing — with one site that enforces the competition rules itself.

## Running it

```bash
npm install
cp .env.local.example .env.local   # then fill in the three values
npm run dev
```

`.env.local` needs the Supabase project URL, the publishable key and the
secret key. Both keys are in **Supabase → Project Settings → API Keys**.
The file is git-ignored; never commit it.

| Script | What it does |
|---|---|
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript, no emit |

## How it is put together

- **Next.js 15** (App Router, server components) on Vercel
- **Supabase** — Postgres, Google sign-in, file storage, row level security
- No CSS framework; the design tokens live in `src/app/globals.css`

### The rules are in the database, not the UI

One person cannot register for two teams. Jersey numbers and jersey names are
unique inside a team. A team may have at most three Masiswa players, of whom
at most one is a State player. A jersey colour is claimed once per competition
and near-identical colours are rejected. Entry fees are derived from the
roster rather than typed in.

All of that is enforced by unique indexes and triggers in Postgres, so a bug
in the front end, a stale browser tab, or two people clicking at the same
moment cannot get around it. See `supabase/README.md`.

### Who sees what

| | |
|---|---|
| Anonymous | Published competition details, terms, and the fixtures page. Nothing else. |
| Player | No account. Opens a tokenised link, submits their own details, sees nothing else. |
| Team manager | Their own team only, including their players' full IC numbers. |
| Organiser | Everything, split into super / finance / fixtures roles. |

Enforced by row level security. Anonymous visitors reach three database
functions and nothing else — `invite_context`, `submit_player`, `get_fixtures`.

## Layout

```
src/
  app/
    page.tsx              landing, routes a signed-in account to its home
    login/                Google sign-in
    auth/callback/        OAuth return
    admin/                organiser console
    team/                 team manager
    join/[token]/         player form, no sign-in
    fixtures/[slug]/      public schedule
    privacy/  terms/      linked from the Google consent screen
  components/             language switch, sign in / out
  lib/
    supabase/             browser, server and service-role clients, DB types
    i18n/                 every string in English and Chinese
    session.ts            resolves the viewer to admin / manager / unknown
supabase/migrations/      the database, in order
```

## Language

English and Chinese, switched in the header and remembered in a cookie.
Strings live in `src/lib/i18n/dict.ts`; the terms and competition names are
stored in both languages in the database so the organiser can edit them
without a deploy.
