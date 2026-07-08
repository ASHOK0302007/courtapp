# Production deployment checklist

Work through this before pointing real users at the app.

## Database

- [ ] Run every migration in order against the production Supabase project
      (`supabase link --project-ref <prod-ref> && supabase db push`).
- [ ] Do **not** run `supabase/seed.sql` against production — it creates
      known test accounts with a published password. It's for local/dev
      only.
- [ ] Run `npm run audit:rls` against a **staging** project seeded with
      test data and confirm every check passes before promoting to
      production. Re-run it after any migration that touches RLS policies
      or triggers.
- [ ] Confirm Point-in-Time Recovery (or at minimum daily backups) is
      enabled on the production Supabase project — a court records system
      cannot lose data.
- [ ] Regenerate `lib/types/database.types.ts` from the production schema
      (`npm run supabase:types`) and commit it, so the deployed app's types
      match the deployed schema exactly.

## Auth

- [ ] In Supabase Dashboard → Authentication → URL Configuration, set the
      Site URL and Redirect URLs to the production domain (not
      `localhost`).
- [ ] Turn on email confirmation for signups in production
      (`enable_confirmations = true` — the local `config.toml` disables it
      for faster local testing).
- [ ] Review Supabase's built-in auth rate limits (Authentication →
      Rate Limits) — these are the only rate limiting on `/login`,
      `/register`, and `/forgot-password`, since those calls go straight
      from the browser to Supabase Auth and never touch our own Route
      Handlers. If you need stricter limits, proxy those calls through a
      Route Handler and apply `lib/rate-limit.ts` (or its Upstash upgrade)
      there instead.
- [ ] Create the real first admin account directly in Supabase (SQL editor
      or `supabase.auth.admin.createUser` from a one-off script) — there's
      no seed admin in production, and the app has no bootstrap flow by
      design (every other officer/judge/admin account is created *by* an
      admin).

## Environment variables (set in Vercel → Settings → Environment Variables)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from
      the production Supabase project.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — production service role key. **Never**
      expose this as a `NEXT_PUBLIC_*` variable or log it.
- [ ] `NEXT_PUBLIC_SITE_URL` — the production URL, used to build links in
      emails.
- [ ] `RESEND_API_KEY` / `NOTIFICATION_FROM_EMAIL` /
      `SUPABASE_WEBHOOK_SECRET` — if you've wired up the email-notification
      webhook (see Phase 6 notes; this app ships with in-app + Realtime
      notifications, email delivery is an extension point).

## Rate limiting

- [ ] The in-memory limiter in `lib/rate-limit.ts` is per-serverless-
      instance, which is a real limitation on Vercel's scale-out model. For
      launch traffic this is a reasonable baseline; if you expect
      meaningful abuse-scale traffic, swap it for Upstash Redis
      (`@upstash/ratelimit`) as described in the comment at the bottom of
      that file — the call sites (`checkRateLimit(...)`) don't need to
      change.
- [ ] Confirm Vercel's platform-level DDoS/abuse protection is enabled
      (on by default for all plans, configurable on Pro+).

## Storage

- [ ] Confirm the `case-documents` bucket is private (not public) —
      `0005_storage.sql` creates it private; double check in the dashboard.
- [ ] Set a Storage-level file size limit matching `system_settings.max_upload_size_mb`
      (Supabase Dashboard → Storage → Configuration), so oversized files
      are rejected before they count against bandwidth.
- [ ] Run `supabase/tests/load-test-uploads.js` against staging (see the
      warning in that file — never against production) to confirm the
      upload path holds up under concurrent load before launch.

## Observability

- [ ] Enable Vercel's Web Analytics or an APM of your choice so failed
      Route Handler requests (500s, rate-limit 429s) are visible.
- [ ] Set up an alert on Supabase's dashboard for elevated database CPU or
      connection count — RLS policies with subqueries (e.g. the
      `documents`/`hearings` "participants select" policies) add per-row
      overhead that's worth watching under real load.
- [ ] Confirm `audit_log` is actually being populated in production (spot
      check a few rows after a real case status change) — it's the primary
      trail for "who did what" if a dispute arises.

## Final smoke test (in production, before sharing the URL)

- [ ] Sign up a real citizen account, file a case, upload a document.
- [ ] As the admin account, create an officer and judge account.
- [ ] As the officer, verify the case, review the document, assign the
      judge, schedule a hearing.
- [ ] As the judge, add hearing notes, draft and publish a judgment.
- [ ] Confirm the citizen sees the notification, the case shows as closed,
      and the judgment downloads correctly.
- [ ] Confirm a citizen cannot reach `/officer/*`, `/judge/*`, or
      `/admin/*` routes (should redirect to their own dashboard).
