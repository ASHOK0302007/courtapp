import { requireRoleApi, ApiError } from "@/lib/auth/require-role";
import { getDocumentDownloadUrl } from "@/lib/services/documents.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRoleApi("citizen", "court_officer", "judge", "admin");
    const { id } = await params;

    const { url, fileName } = await getDocumentDownloadUrl(id);

    return Response.json({ data: { url, fileName } });
  } catch (err) {
    if (err instanceof ApiError) return err.toResponse();
    return Response.json({ error: { code: "INTERNAL", message: "Unexpected error." } }, { status: 500 });
  }
}
