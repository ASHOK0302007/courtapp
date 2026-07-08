import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError } from "@/lib/auth/require-role";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/admin.schema";

/**
 * Creates an officer, judge, or admin account. This is the ONLY way those
 * roles come into existence — self-registration always defaults to
 * 'citizen' (see handle_new_user() in the Phase 1 migrations). Uses the
 * service-role client because creating an auth user and immediately
 * setting a non-default role requires bypassing RLS; the calling route
 * handler must already have verified the caller is an admin.
 */
export async function createUserAccount(input: CreateUserInput) {
  const supabase = createAdminClient();

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });

  if (createError || !created.user) {
    throw new ApiError(400, "USER_CREATE_FAILED", createError?.message ?? "Could not create the account.");
  }

  // handle_new_user() has already inserted a 'citizen' profile row by this
  // point (trigger fires on auth.users insert) — update it to the intended
  // role and badge/bar ID.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .update({ role: input.role, bar_or_badge_id: input.barOrBadgeId || null })
    .eq("id", created.user.id)
    .select()
    .single();

  if (profileError || !profile) {
    throw new ApiError(500, "PROFILE_UPDATE_FAILED", "Account created but role assignment failed.", profileError?.message);
  }

  return profile;
}

/** Updates an existing user's role, active status, badge ID, or name. */
export async function updateUserAccount(userId: string, input: UpdateUserInput) {
  const supabase = createAdminClient();

  const patch: Record<string, unknown> = {};
  if (input.role) patch.role = input.role;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.barOrBadgeId !== undefined) patch.bar_or_badge_id = input.barOrBadgeId || null;
  if (input.fullName) patch.full_name = input.fullName;

  const { data, error } = await supabase.from("profiles").update(patch).eq("id", userId).select().single();

  if (error || !data) {
    throw new ApiError(500, "USER_UPDATE_FAILED", "Could not update the account.", error?.message);
  }

  return data;
}

/** Lists all users, optionally filtered by role, newest first. */
export async function listUsers(role?: string) {
  const supabase = createAdminClient();

  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (role) query = query.eq("role", role);

  const { data, error } = await query;

  if (error) {
    throw new ApiError(500, "USER_LIST_FAILED", "Could not load users.", error.message);
  }

  return data;
}

/** Loads every system_settings row as a plain key → value map. */
export async function getSystemSettings() {
  const supabase = createAdminClient();

  const { data, error } = await supabase.from("system_settings").select("*");

  if (error) {
    throw new ApiError(500, "SETTINGS_LOAD_FAILED", "Could not load system settings.", error.message);
  }

  return data;
}

export async function updateSystemSetting(key: string, value: unknown, updatedBy: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("system_settings")
    .update({ value, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq("key", key)
    .select()
    .single();

  if (error || !data) {
    throw new ApiError(500, "SETTING_UPDATE_FAILED", "Could not update the setting.", error?.message);
  }

  return data;
}

/** System-wide case monitoring — every case, regardless of assignment. */
export async function listAllCasesAdmin() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("filed_at", { ascending: false });

  if (error) {
    throw new ApiError(500, "CASE_LIST_FAILED", "Could not load cases.", error.message);
  }

  return data;
}
