import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { markNotificationRead } from "@/lib/services/notifications.service";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRoleApi("citizen", "court_officer", "judge", "admin");
    const { id } = await params;
    const updated = await markNotificationRead(id);
    return Response.json({ data: updated });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
