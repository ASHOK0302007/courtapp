import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { publishJudgment } from "@/lib/services/judgments.service";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRoleApi("judge");
    const { id } = await params;

    const published = await publishJudgment(id);

    return Response.json({ data: published });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
