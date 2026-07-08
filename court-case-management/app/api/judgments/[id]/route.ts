import { NextRequest } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { draftJudgmentSchema } from "@/lib/validations/judgment.schema";
import { updateJudgmentDraft } from "@/lib/services/judgments.service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRoleApi("judge");
    const { id } = await params;

    const body = await request.json();
    const parsed = draftJudgmentSchema.partial().safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Check the judgment text.", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const updated = await updateJudgmentDraft(id, parsed.data);

    return Response.json({ data: updated });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
