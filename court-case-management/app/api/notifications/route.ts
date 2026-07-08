import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { listNotifications } from "@/lib/services/notifications.service";

export async function GET() {
  try {
    await requireRoleApi("citizen", "court_officer", "judge", "admin");
    const notifications = await listNotifications();
    return Response.json({ data: notifications });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
