/**
 * RLS policy audit — runs a matrix of "should succeed" / "should fail"
 * operations as each seeded test role and reports any mismatch.
 *
 * This exercises the database directly through the anon key + RLS, the
 * same path the app itself uses, rather than mocking policies — so it
 * catches gaps in the actual applied policies/triggers, not just the SQL
 * source.
 *
 * Usage:
 *   1. supabase db reset   (applies migrations + supabase/seed.sql locally)
 *      — or run against a deployed project that has been seeded.
 *   2. cp .env.local .env.audit  # or export the vars below directly
 *   3. npx tsx supabase/tests/rls-audit.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 * Uses the seeded accounts from supabase/seed.sql (Password123!).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before running this script.");
  process.exit(1);
}

const SEEDED_CASE_ID = "10000000-0000-0000-0000-000000000001";

const USERS = {
  citizen: { email: "citizen@example.com", password: "Password123!" },
  officer: { email: "officer@example.com", password: "Password123!" },
  judge: { email: "judge@example.com", password: "Password123!" },
  admin: { email: "admin@example.com", password: "Password123!" },
} as const;

type RoleName = keyof typeof USERS;

interface CheckResult {
  label: string;
  expected: "allow" | "deny";
  actual: "allow" | "deny";
  pass: boolean;
  detail?: string;
}

const results: CheckResult[] = [];

function record(label: string, expected: "allow" | "deny", errored: boolean, detail?: string) {
  const actual = errored ? "deny" : "allow";
  results.push({ label, expected, actual, pass: actual === expected, detail });
}

async function signIn(role: RoleName): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
  const { email, password } = USERS[role];
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Could not sign in as ${role} (${email}): ${error.message}. Did you run the seed script?`);
  }
  return client;
}

async function run() {
  const citizen = await signIn("citizen");
  const officer = await signIn("officer");
  const judge = await signIn("judge");
  const admin = await signIn("admin");

  // --- citizen ---------------------------------------------------------
  {
    const { error } = await citizen.from("cases").select("*").eq("id", SEEDED_CASE_ID).single();
    record("citizen: read own case", "allow", !!error, error?.message);
  }
  {
    const { error } = await citizen
      .from("cases")
      .update({ assigned_officer_id: (await citizen.auth.getUser()).data.user?.id })
      .eq("id", SEEDED_CASE_ID);
    record("citizen: cannot self-assign as officer", "deny", !error, error?.message);
  }
  {
    const { error } = await citizen.from("cases").update({ status: "closed" }).eq("id", SEEDED_CASE_ID);
    record("citizen: cannot close their own case", "deny", !error, error?.message);
  }
  {
    const { error } = await citizen.from("profiles").update({ role: "admin" }).eq("id", (await citizen.auth.getUser()).data.user?.id ?? "");
    record("citizen: cannot self-promote to admin", "deny", !error, error?.message);
  }
  {
    const { data, error } = await citizen.from("audit_log").select("*").limit(1);
    record("citizen: cannot read audit_log", "deny", !error && (data?.length ?? 0) >= 0 && !error, error?.message);
    // audit_log has no citizen SELECT policy at all, so RLS returns an
    // empty set rather than an error — check for zero rows instead.
    results[results.length - 1].actual = (data?.length ?? 0) === 0 ? "deny" : "allow";
    results[results.length - 1].pass = results[results.length - 1].actual === "deny";
  }

  // --- officer -----------------------------------------------------------
  {
    const { error } = await officer
      .from("cases")
      .update({ status: "judgment_published" })
      .eq("id", SEEDED_CASE_ID);
    record("officer: cannot directly publish a judgment via case status", "deny", !error, error?.message);
  }
  {
    const { error } = await officer.from("cases").update({ status: "verified" }).eq("id", SEEDED_CASE_ID);
    record("officer: can verify an assigned case", "allow", !!error, error?.message);
  }
  {
    const { error } = await officer.from("profiles").update({ role: "admin" }).eq("id", (await officer.auth.getUser()).data.user?.id ?? "");
    record("officer: cannot self-promote to admin", "deny", !error, error?.message);
  }

  // --- judge ---------------------------------------------------------
  {
    const { data: existing } = await judge.from("judgments").select("id").eq("case_id", SEEDED_CASE_ID).maybeSingle();
    if (!existing) {
      const { error } = await judge.from("judgments").insert({
        case_id: SEEDED_CASE_ID,
        judge_id: (await judge.auth.getUser()).data.user?.id,
        verdict_summary: "Audit script test draft — safe to delete",
        full_text: "This draft judgment was created by the RLS audit script and can be deleted.",
      });
      record("judge: can draft a judgment for an assigned case", "allow", !!error, error?.message);
    } else {
      record("judge: can draft a judgment for an assigned case (already exists, skipped)", "allow", false);
    }
  }
  {
    const { error } = await judge.from("cases").update({ citizen_id: crypto.randomUUID() }).eq("id", SEEDED_CASE_ID);
    record("judge: cannot change who filed the case", "deny", !error, error?.message);
  }

  // --- admin ---------------------------------------------------------
  {
    const { error } = await admin.from("cases").select("*").limit(1);
    record("admin: can read across all cases", "allow", !!error, error?.message);
  }
  {
    const { error } = await admin.from("system_settings").update({ value: "20" }).eq("key", "max_upload_size_mb");
    record("admin: can update system settings", "allow", !!error, error?.message);
  }

  // --- report ---------------------------------------------------------
  console.log("\nRLS policy audit results\n" + "=".repeat(60));
  let failures = 0;
  for (const r of results) {
    const status = r.pass ? "PASS" : "FAIL";
    if (!r.pass) failures++;
    console.log(`[${status}] ${r.label} — expected ${r.expected}, got ${r.actual}${r.detail ? ` (${r.detail})` : ""}`);
  }
  console.log("=".repeat(60));
  console.log(`${results.length - failures}/${results.length} checks passed`);

  if (failures > 0) process.exitCode = 1;
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
