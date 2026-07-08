import { NextRequest } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { draftJudgmentSchema } from "@/lib/validations/judgment.schema";
import { draftJudgment } from "@/lib/services/judgments.service";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRoleApi("judge");

    const body = await request.json();
    const parsed = draftJudgmentSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Check the judgment text.", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const judgment = await draftJudgment(session.id, parsed.data);

    return Response.json({ data: judgment }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
