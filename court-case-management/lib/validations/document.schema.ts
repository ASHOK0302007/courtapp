import { z } from "zod";

export const documentTypeEnum = z.enum([
  "evidence",
  "affidavit",
  "identity_proof",
  "prior_judgment",
  "other",
]);

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB, mirrors system_settings default
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const uploadDocumentMetaSchema = z.object({
  caseId: z.string().uuid(),
  documentType: documentTypeEnum,
  fileName: z.string().trim().min(1).max(255),
  fileSizeBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES, "File exceeds the 20MB limit"),
  mimeType: z.enum(ALLOWED_MIME_TYPES as [string, ...string[]], {
    errorMap: () => ({ message: "Unsupported file type" }),
  }),
});

export type UploadDocumentMetaInput = z.infer<typeof uploadDocumentMetaSchema>;

export const reviewDocumentSchema = z.object({
  reviewStatus: z.enum(["approved", "rejected"]),
  reviewNotes: z.string().trim().max(2000).optional(),
});

export type ReviewDocumentInput = z.infer<typeof reviewDocumentSchema>;
