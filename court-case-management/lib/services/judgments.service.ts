import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError } from "@/lib/auth/require-role";
import type { DraftJudgmentInput } from "@/lib/validations/judgment.schema";

/**
 * Creates a draft judgment for a case. RLS requires the caller to be the
 * judge assigned to that case, and `judgments.case_id` is unique, so a
 * second draft attempt fails at the database rather than silently
 * overwriting one.
 */
export async function draftJudgment(judgeId: string, input: DraftJudgmentInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("judgments")
    .insert({
      case_id: input.caseId,
      judge_id: judgeId,
      verdict_summary: input.verdictSummary,
      full_text: input.fullText,
    })
    .select()
    .single();

  if (error || !data) {
    throw new ApiError(403, "JUDGMENT_CREATE_FAILED", "Could not save the draft judgment.", error?.message);
  }

  return data;
}

/** Updates an existing draft (still unpublished) judgment's text. */
export async function updateJudgmentDraft(judgmentId: string, input: Partial<DraftJudgmentInput>) {
  const supabase = await createClient();

  const patch: Record<string, unknown> = {};
  if (input.verdictSummary) patch.verdict_summary = input.verdictSummary;
  if (input.fullText) patch.full_text = input.fullText;

  const { data, error } = await supabase
    .from("judgments")
    .update(patch)
    .eq("id", judgmentId)
    .is("published_at", null)
    .select()
    .single();

  if (error || !data) {
    throw new ApiError(403, "JUDGMENT_UPDATE_FAILED", "Could not update the draft judgment.", error?.message);
  }

  return data;
}

/**
 * Publishes a judgment. The notify_on_judgment_published trigger (Phase 1)
 * handles notifying the citizen and transitioning the case to
 * 'judgment_published' with closed_at set, so this is just the one update.
 */
export async function publishJudgment(judgmentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("judgments")
    .update({ published_at: new Date().toISOString() })
    .eq("id", judgmentId)
    .select()
    .single();

  if (error || !data) {
    throw new ApiError(403, "JUDGMENT_PUBLISH_FAILED", "Could not publish the judgment.", error?.message);
  }

  return data;
}

/**
 * Generates a signed URL for the judgment's PDF, if one was attached.
 * Confirms read access via the RLS-scoped client first (same pattern as
 * documents), so an unpublished judgment for someone else's case can't be
 * fetched even by guessing an id.
 */
export async function getJudgmentDownloadUrl(judgmentId: string) {
  const scoped = await createClient();
  const { data: judgment, error } = await scoped.from("judgments").select("*").eq("id", judgmentId).single();

  if (error || !judgment) {
    throw new ApiError(404, "JUDGMENT_NOT_FOUND", "Judgment not found or you don't have access to it.");
  }

  if (!judgment.document_storage_path) {
    throw new ApiError(404, "NO_PDF_ATTACHED", "No PDF has been attached to this judgment yet.");
  }

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from("case-documents")
    .createSignedUrl(judgment.document_storage_path, 60 * 5);

  if (signError || !signed) {
    throw new ApiError(500, "DOWNLOAD_URL_FAILED", "Could not generate a download link.", signError?.message);
  }

  return { url: signed.signedUrl };
}
