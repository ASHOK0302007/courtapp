import { NextRequest } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { assignCaseSchema } from "@/lib/validations/case.schema";
import { assignCase } from "@/lib/services/cases.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRoleApi("court_officer", "admin");
    const { id } = await params;

    const body = await request.json();
    const parsed = assignCaseSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Check the assignment.", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    if (!parsed.data.assignedOfficerId && !parsed.data.assignedJudgeId) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Provide an officer or judge to assign." } },
        { status: 400 }
      );
    }

    const updated = await assignCase(id, {
      assignedOfficerId: parsed.data.assignedOfficerId,
      assignedJudgeId: parsed.data.assignedJudgeId,
    });

    return Response.json({ data: updated });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
