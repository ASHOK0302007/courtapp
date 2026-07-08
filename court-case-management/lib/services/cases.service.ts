import "server-only";
import { createClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/auth/require-role";
import type { FileCaseInput } from "@/lib/validations/case.schema";

/**
 * Files a new case + its initiating appeal for the given citizen in a
 * single transaction via an RPC, so the two inserts either both succeed or
 * both fail. (See supabase/migrations for the `file_case` function — for
 * Phase 0/1 this uses two sequential inserts guarded by RLS; swap in an RPC
 * once the transactional version is added in a later migration.)
 */
export async function fileCase(citizenId: string, input: FileCaseInput) {
  const supabase = await createClient();

  const { data: newCase, error: caseError } = await supabase
    .from("cases")
    .insert({
      title: input.title,
      description: input.description,
      case_type: input.caseType,
      citizen_id: citizenId,
    })
    .select()
    .single();

  if (caseError || !newCase) {
    throw new ApiError(500, "CASE_CREATE_FAILED", "Could not file the case.", caseError?.message);
  }

  const { error: appealError } = await supabase.from("appeals").insert({
    case_id: newCase.id,
    appellant_id: citizenId,
    grounds_for_appeal: input.groundsForAppeal,
    original_judgment_ref: input.originalJudgmentRef || null,
    relief_sought: input.reliefSought,
  });

  if (appealError) {
    throw new ApiError(500, "APPEAL_CREATE_FAILED", "Could not record the appeal.", appealError.message);
  }

  return newCase;
}

/**
 * Lists cases visible to the current user. RLS already scopes the result
 * set by role (citizen: own cases; officer: own queue + unassigned; judge:
 * assigned cases; admin: all), so this is a plain select.
 */
export async function listCases() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("filed_at", { ascending: false });

  if (error) {
    throw new ApiError(500, "CASE_LIST_FAILED", "Could not load cases.", error.message);
  }

  return data;
}

/**
 * Updates a case's status (verify, reject, mark in-hearing, etc). RLS
 * ensures only the assigned officer/judge or an admin can perform the
 * update; the notify_on_case_status_change trigger handles the resulting
 * notification and audit log entry.
 */
export async function updateCaseStatus(
  caseId: string,
  status: string,
  opts?: { setVerifiedAt?: boolean }
) {
  const supabase = await createClient();

  const patch: Record<string, unknown> = { status };
  if (opts?.setVerifiedAt) patch.verified_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("cases")
    .update(patch)
    .eq("id", caseId)
    .select()
    .single();

  if (error || !data) {
    throw new ApiError(403, "CASE_UPDATE_FAILED", "Could not update the case status.", error?.message);
  }

  return data;
}

/**
 * Assigns a case to an officer and/or a judge. Officers claim unassigned
 * cases into their own queue; either an officer or an admin can assign the
 * judge who will hear it.
 */
export async function assignCase(
  caseId: string,
  assignment: { assignedOfficerId?: string; assignedJudgeId?: string }
) {
  const supabase = await createClient();

  const patch: Record<string, unknown> = {};
  if (assignment.assignedOfficerId) patch.assigned_officer_id = assignment.assignedOfficerId;
  if (assignment.assignedJudgeId) {
    patch.assigned_judge_id = assignment.assignedJudgeId;
    patch.status = "assigned";
  }

  const { data, error } = await supabase
    .from("cases")
    .update(patch)
    .eq("id", caseId)
    .select()
    .single();

  if (error || !data) {
    throw new ApiError(403, "CASE_ASSIGN_FAILED", "Could not assign the case.", error?.message);
  }

  return data;
}

/** Loads a single case with its appeal, documents, hearings, and judgment. */
export async function getCaseDetail(caseId: string) {
  const supabase = await createClient();

  const { data: caseRow, error } = await supabase.from("cases").select("*").eq("id", caseId).single();
  if (error || !caseRow) {
    throw new ApiError(404, "CASE_NOT_FOUND", "Case not found or you don't have access to it.");
  }

  const [{ data: appeal }, { data: documents }, { data: hearings }, { data: judgment }] = await Promise.all([
    supabase.from("appeals").select("*").eq("case_id", caseId).maybeSingle(),
    supabase.from("documents").select("*").eq("case_id", caseId).order("uploaded_at", { ascending: false }),
    supabase.from("hearings").select("*").eq("case_id", caseId).order("hearing_date", { ascending: true }),
    supabase.from("judgments").select("*").eq("case_id", caseId).maybeSingle(),
  ]);

  return { case: caseRow, appeal, documents: documents ?? [], hearings: hearings ?? [], judgment };
}
