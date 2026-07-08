# Docket — Court Case Management System

Next.js 15 + Supabase court case management system, covering Citizen, Court
Officer, Judge, and Admin roles.

This drop is **Phase 0 (project setup) + Phase 1 (database & auth
foundation) + Phase 3 (court officer flow) + Phase 4 (judge flow) + Phase 5
(admin flow) + Phase 6 (cross-cutting polish) + Phase 7 (hardening &
deployment)**, plus a working end-to-end slice of Phase 2 (citizen appeal
filing) to demonstrate the CRUD pattern the rest of the app follows. All
seven phases from the original roadmap are now represented.

## What's included

- Full Postgres schema, indexes, triggers, and Row Level Security policies
  (`supabase/migrations/`) for every table in the design doc.
- Supabase Auth: signup (citizen self-registration), login, forgot/reset
  password.
- Role-based routing enforced in `middleware.ts` plus a server-side
  `requireRole()` guard in every protected layout.
- Dashboards for all four roles reading real (RLS-protected) data.
- The citizen "file a new appeal" flow end-to-end: form → Zod validation →
  `/api/cases` route handler → `cases` + `appeals` insert → case detail page.
- The full court officer review flow: claim/verify/reject a case, approve
  or reject each uploaded document, assign a judge, and schedule a hearing
  — all backed by `/api/cases/[id]/status`, `/api/cases/[id]/assign`,
  `/api/documents/[id]/review`, and `/api/hearings` route handlers.
- The full judge flow: record and update hearing notes, mark hearings
  completed/postponed, draft and publish a judgment, and close a case
  directly when no judgment is needed — backed by `/api/judgments`,
  `/api/judgments/[id]`, `/api/judgments/[id]/publish`, and reusing
  `/api/hearings/[id]` and `/api/cases/[id]/status`. Publishing a judgment
  triggers the Phase 1 database trigger that notifies the citizen and
  closes the case automatically.
- The full admin flow: create officer/judge/admin accounts (the only way
  those roles come into existence), edit any account's role/status/badge
  ID, monitor every case system-wide, and edit system settings — backed by
  `/api/admin/users`, `/api/admin/users/[id]`, `/api/admin/settings`, and
  `/api/admin/analytics`. These routes use the service-role client
  (`lib/supabase/admin.ts`) since they intentionally act across every
  user's data, gated by an explicit `requireRoleApi("admin")` check before
  any service-role call is made.
- Document upload: citizens upload files directly to a private Supabase
  Storage bucket from the browser, then `/api/documents/upload` records
  the metadata row (validated size/type). Downloads (`/api/documents/[id]
  /download`, `/api/judgments/[id]/download`) issue short-lived signed URLs
  after re-checking access through the RLS-scoped client.
- A live notification bell (Supabase Realtime) in the dashboard topbar for
  every role, plus a full notifications page for citizens with mark-as-read.
- Hearing calendars for citizens and judges (mirroring the officer one from
  Phase 3), and a working profile page for all four roles (edit name/phone,
  change password).
- **Hardening**: a migration (`0007_hardening.sql`) closing column-level
  RLS gaps the audit found — e.g. a citizen could otherwise set
  `assigned_officer_id` on their own case, or an officer could set case
  status straight to `judgment_published` without a judge ever publishing
  one. A runnable RLS audit script (`supabase/tests/rls-audit.ts`,
  `npm run audit:rls`) that signs in as each seeded role and checks a
  matrix of allow/deny expectations against the live database. A basic
  in-memory rate limiter (`lib/rate-limit.ts`) applied to case filing,
  document upload, and admin account creation, with an documented upgrade
  path to Upstash Redis for multi-instance deployments. A k6 load test for
  the document upload path (`supabase/tests/load-test-uploads.js`). And a
  full production deployment checklist (`docs/DEPLOYMENT_CHECKLIST.md`).
- Design system: Tailwind tokens (`tailwind.config.ts`), UI primitives in
  `components/ui/`, and a distinct "judicial ledger" visual identity
  (ink navy + brass, Fraunces/Inter/IBM Plex Mono).
- Everywhere else the nav links to (hearing calendars, document review,
  judgment publishing, admin user management, etc.) is stubbed with a
  labeled placeholder noting which roadmap phase builds it out, so the app
  is fully clickable and doesn't 404.

## Getting started

### 1. Create a Supabase project

Create a project at https://supabase.com, then grab the project URL, anon
key, and service role key from **Project Settings → API**.

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run the database migrations

With the [Supabase CLI](https://supabase.com/docs/guides/cli) installed and
linked to your project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push          # applies supabase/migrations/*.sql in order
supabase db seed          # optional: loads supabase/seed.sql test accounts
```

Locally, `supabase start` + `supabase db reset` will run the migrations and
seed script against the local Docker stack instead.

Seeded test accounts (password `Password123!` for all):

| Email | Role |
|---|---|
| citizen@example.com | Citizen |
| officer@example.com | Court officer |
| judge@example.com | Judge |
| admin@example.com | Admin |

### 5. Regenerate types against your live schema

```bash
SUPABASE_PROJECT_ID=<your-project-ref> npm run supabase:types
```

This overwrites the hand-written `lib/types/database.types.ts` stub with
types generated from your actual database — do this once the migrations
are applied.

### 6. Run the app

```bash
npm run dev
```

## Deploying to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import it into Vercel.
3. Add the same environment variables from `.env.local` in the Vercel
   project's **Settings → Environment Variables**.
4. Deploy. `middleware.ts` runs on Vercel's Edge Runtime by default — no
   extra configuration needed.

## Project structure

See `court-case-management-system-plan.md` (the design doc shared before
this code) for the full architecture, schema, and API design. The folder
layout in this repo follows that plan's route groups: `(citizen)`,
`(officer)`, `(judge)`, `(admin)`, `(auth)`, `(marketing)`.

## Roadmap status

- [x] Phase 0 — project scaffold
- [x] Phase 1 — database schema, RLS, auth, route guards
- [~] Phase 2 — citizen core flow (appeal filing, document upload/download,
      hearing calendar, notifications, and judgment view are all done;
      remaining polish folded into Phase 6)
- [x] Phase 3 — court officer flow (case verification, document review,
      judge assignment, hearing scheduling)
- [x] Phase 4 — judge flow (hearing notes, judgment drafting/publishing,
      case closure)
- [x] Phase 5 — admin flow (user management, case monitoring, settings)
- [x] Phase 6 — cross-cutting polish (document upload/download,
      notifications, hearing calendars, profile pages)
- [x] Phase 7 — hardening & deployment (RLS audit + fixes, rate limiting,
      load test script, deployment checklist)

See `docs/DEPLOYMENT_CHECKLIST.md` before pointing real users at a
production deployment.
