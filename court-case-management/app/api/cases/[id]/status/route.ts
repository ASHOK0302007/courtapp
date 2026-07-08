import { NextRequest } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { updateCaseStatusSchema } from "@/lib/validations/case.schema";
import { updateCaseStatus } from "@/lib/services/cases.service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRoleApi("court_officer", "judge", "admin");
    const { id } = await params;

    const body = await request.json();
    const parsed = updateCaseStatusSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Check the submitted status.", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const updated = await updateCaseStatus(id, parsed.data.status, {
      setVerifiedAt: parsed.data.status === "verified",
    });

    return Response.json({ data: updated });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
