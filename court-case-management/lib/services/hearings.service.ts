import "server-only";
import { createClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/auth/require-role";
import type { ScheduleHearingInput, UpdateHearingInput } from "@/lib/validations/hearing.schema";

/**
 * Schedules a hearing for a case. RLS requires the caller to be the
 * court_officer assigned to that case. Also advances the case status to
 * 'scheduled' so the citizen sees progress without a second request.
 */
export async function scheduleHearing(officerId: string, input: ScheduleHearingInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hearings")
    .insert({
      case_id: input.caseId,
      scheduled_by: officerId,
      judge_id: input.judgeId,
      hearing_date: input.hearingDate,
      location: input.location,
    })
    .select()
    .single();

  if (error || !data) {
    throw new ApiError(403, "HEARING_CREATE_FAILED", "Could not schedule the hearing.", error?.message);
  }

  await supabase.from("cases").update({ status: "scheduled" }).eq("id", input.caseId);

  return data;
}

/**
 * Updates a hearing — reschedule, postpone/cancel, or add the judge's
 * hearing notes. RLS restricts this to the officer who scheduled it or the
 * assigned judge.
 */
export async function updateHearing(hearingId: string, input: UpdateHearingInput) {
  const supabase = await createClient();

  const patch: Record<string, unknown> = {};
  if (input.hearingDate) patch.hearing_date = input.hearingDate;
  if (input.location) patch.location = input.location;
  if (input.status) patch.status = input.status;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.nextHearingDate !== undefined) patch.next_hearing_date = input.nextHearingDate;

  const { data, error } = await supabase
    .from("hearings")
    .update(patch)
    .eq("id", hearingId)
    .select()
    .single();

  if (error || !data) {
    throw new ApiError(403, "HEARING_UPDATE_FAILED", "Could not update the hearing.", error?.message);
  }

  return data;
}

/** Lists hearings visible to the current user (RLS-scoped by case participation). */
export async function listHearings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hearings")
    .select("*, cases(case_number, title)")
    .order("hearing_date", { ascending: true });

  if (error) {
    throw new ApiError(500, "HEARING_LIST_FAILED", "Could not load hearings.", error.message);
  }

  return data;
}
