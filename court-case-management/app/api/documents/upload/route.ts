import { NextRequest } from "next/server";
import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { uploadDocumentMetaSchema } from "@/lib/validations/document.schema";
import { recordDocumentUpload } from "@/lib/services/documents.service";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRoleApi("citizen", "court_officer");

    const rate = checkRateLimit(`documents:upload:${session.id}`, 20, 60_000);
    if (!rate.allowed) return rateLimitResponse(rate);

    const body = await request.json();
    const { storagePath, ...meta } = body ?? {};
    const parsed = uploadDocumentMetaSchema.safeParse(meta);

    if (!parsed.success || typeof storagePath !== "string" || !storagePath) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Check the file details.", details: parsed.success ? undefined : parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const document = await recordDocumentUpload(session.id, storagePath, parsed.data);

    return Response.json({ data: document }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
