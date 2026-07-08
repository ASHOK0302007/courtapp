import { NextRequest } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { fileCaseSchema } from "@/lib/validations/case.schema";
import { fileCase, listCases } from "@/lib/services/cases.service";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRoleApi("citizen");

    // A citizen filing dozens of cases a minute is either a bug in their
    // client or abuse — either way, slow it down rather than let it hit
    // the database unchecked.
    const rate = checkRateLimit(`cases:file:${session.id}`, 5, 60_000);
    if (!rate.allowed) return rateLimitResponse(rate);

    const body = await request.json();
    const parsed = fileCaseSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Check the highlighted fields.", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const newCase = await fileCase(session.id, parsed.data);

    return Response.json({ data: newCase }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}

export async function GET() {
  try {
    await requireRoleApi("citizen", "court_officer", "judge", "admin");
    const cases = await listCases();
    return Response.json({ data: cases });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
