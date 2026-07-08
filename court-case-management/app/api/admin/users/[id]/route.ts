import { NextRequest } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { updateUserSchema } from "@/lib/validations/admin.schema";
import { updateUserAccount } from "@/lib/services/admin.service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRoleApi("admin");
    const { id } = await params;

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Check the account details.", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const updated = await updateUserAccount(id, parsed.data);

    return Response.json({ data: updated });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
