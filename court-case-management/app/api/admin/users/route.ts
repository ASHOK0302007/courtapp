import { NextRequest } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { createUserSchema } from "@/lib/validations/admin.schema";
import { createUserAccount, listUsers } from "@/lib/services/admin.service";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRoleApi("admin");

    const rate = checkRateLimit(`admin:create-user:${session.id}`, 10, 60_000);
    if (!rate.allowed) return rateLimitResponse(rate);

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Check the account details.", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const profile = await createUserAccount(parsed.data);

    return Response.json({ data: profile }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireRoleApi("admin");
    const role = request.nextUrl.searchParams.get("role") ?? undefined;
    const users = await listUsers(role);
    return Response.json({ data: users });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
