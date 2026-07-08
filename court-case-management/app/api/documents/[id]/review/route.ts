import { NextRequest } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { reviewDocumentSchema } from "@/lib/validations/document.schema";
import { reviewDocument } from "@/lib/services/documents.service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRoleApi("court_officer", "judge", "admin");
    const { id } = await params;

    const body = await request.json();
    const parsed = reviewDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Check the review decision.", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const updated = await reviewDocument(id, session.id, parsed.data);

    return Response.json({ data: updated });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
