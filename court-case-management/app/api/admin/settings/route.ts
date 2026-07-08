import { NextRequest } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { updateSettingSchema } from "@/lib/validations/admin.schema";
import { getSystemSettings, updateSystemSetting } from "@/lib/services/admin.service";

export async function GET() {
  try {
    await requireRoleApi("admin");
    const settings = await getSystemSettings();
    return Response.json({ data: settings });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireRoleApi("admin");

    const body = await request.json();
    const parsed = updateSettingSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Check the setting value.", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const updated = await updateSystemSetting(parsed.data.key, parsed.data.value, session.id);

    return Response.json({ data: updated });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
