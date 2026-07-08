import { NextRequest } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { updateHearingSchema } from "@/lib/validations/hearing.schema";
import { updateHearing } from "@/lib/services/hearings.service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRoleApi("court_officer", "judge", "admin");
    const { id } = await params;

    const body = await request.json();
    const parsed = updateHearingSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Check the hearing update.", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const updated = await updateHearing(id, parsed.data);

    return Response.json({ data: updated });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
