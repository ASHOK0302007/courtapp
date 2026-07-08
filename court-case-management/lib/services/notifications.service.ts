import "server-only";
import { createClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/auth/require-role";

/** Lists the current user's notifications, newest first. RLS scopes this to recipient_id = auth.uid(). */
export async function listNotifications() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new ApiError(500, "NOTIFICATION_LIST_FAILED", "Could not load notifications.", error.message);
  }

  return data;
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .select()
    .single();

  if (error || !data) {
    throw new ApiError(403, "NOTIFICATION_UPDATE_FAILED", "Could not mark the notification as read.", error?.message);
  }

  return data;
}
