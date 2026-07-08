import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError } from "@/lib/auth/require-role";
import type { ReviewDocumentInput, UploadDocumentMetaInput } from "@/lib/validations/document.schema";

/**
 * Records the metadata row for a file that has already been uploaded to
 * the `case-documents` Storage bucket by the client. RLS on `documents`
 * requires `uploaded_by = auth.uid()` and that the case belongs to (or is
 * assigned to) the uploader, so a citizen can't attach a file to someone
 * else's case even if they guess the storage path.
 */
export async function recordDocumentUpload(uploadedBy: string, storagePath: string, input: UploadDocumentMetaInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .insert({
      case_id: input.caseId,
      uploaded_by: uploadedBy,
      document_type: input.documentType,
      file_name: input.fileName,
      storage_path: storagePath,
      file_size_bytes: input.fileSizeBytes,
      mime_type: input.mimeType,
    })
    .select()
    .single();

  if (error || !data) {
    throw new ApiError(403, "DOCUMENT_RECORD_FAILED", "Could not record the uploaded document.", error?.message);
  }

  return data;
}

/**
 * Generates a short-lived signed URL for downloading a document. First
 * confirms the caller can see the document row at all (via the regular,
 * RLS-scoped client) before using the service-role client to sign the
 * Storage URL — Storage's own RLS policies would also block this, but
 * checking here gives a clean 404 instead of a Storage-level error.
 */
export async function getDocumentDownloadUrl(documentId: string) {
  const scoped = await createClient();
  const { data: doc, error } = await scoped.from("documents").select("*").eq("id", documentId).single();

  if (error || !doc) {
    throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found or you don't have access to it.");
  }

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from("case-documents")
    .createSignedUrl(doc.storage_path, 60 * 5); // 5 minutes

  if (signError || !signed) {
    throw new ApiError(500, "DOWNLOAD_URL_FAILED", "Could not generate a download link.", signError?.message);
  }

  return { url: signed.signedUrl, fileName: doc.file_name };
}

/**
 * Records an officer's or judge's review decision on an uploaded document.
 * RLS restricts the update to court_officer/judge/admin roles.
 */
export async function reviewDocument(documentId: string, reviewerId: string, input: ReviewDocumentInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .update({
      review_status: input.reviewStatus,
      review_notes: input.reviewNotes ?? null,
      reviewed_by: reviewerId,
    })
    .eq("id", documentId)
    .select()
    .single();

  if (error || !data) {
    throw new ApiError(403, "DOCUMENT_REVIEW_FAILED", "Could not update the document review.", error?.message);
  }

  return data;
}
