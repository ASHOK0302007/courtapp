import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type SessionUser = {
  id: string;
  email: string;
  profile: Profile;
};

/**
 * Fetches the current authenticated user and their profile (including
 * role) on the server. Returns null if no session exists. Every protected
 * layout and Route Handler should call this rather than trusting the
 * client.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;

  return { id: user.id, email: user.email ?? profile.email, profile };
}
