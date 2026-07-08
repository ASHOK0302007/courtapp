import { NextRequest } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { scheduleHearingSchema } from "@/lib/validations/hearing.schema";
import { scheduleHearing, listHearings } from "@/lib/services/hearings.service";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRoleApi("court_officer");

    const body = await request.json();
    const parsed = scheduleHearingSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Check the hearing details.", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const hearing = await scheduleHearing(session.id, parsed.data);

    return Response.json({ data: hearing }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}

export async function GET() {
  try {
    await requireRoleApi("citizen", "court_officer", "judge", "admin");
    const hearings = await listHearings();
    return Response.json({ data: hearings });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
