"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MAX_UPLOAD_BYTES, ALLOWED_MIME_TYPES, documentTypeEnum } from "@/lib/validations/document.schema";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";

const DOCUMENT_TYPES = [
  { value: "evidence", label: "Evidence" },
  { value: "affidavit", label: "Affidavit" },
  { value: "identity_proof", label: "Identity proof" },
  { value: "prior_judgment", label: "Prior judgment" },
  { value: "other", label: "Other" },
] as const;

export function DocumentUploader({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("evidence");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setError(null);

    if (file.size > MAX_UPLOAD_BYTES) {
      setError("File exceeds the 20MB limit.");
      return;
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError("Unsupported file type. Use PDF, PNG, JPEG, or Word documents.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const storagePath = `${caseId}/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("case-documents")
        .upload(storagePath, file, { contentType: file.type });

      if (uploadError) throw new Error(uploadError.message);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storagePath,
          caseId,
          documentType: documentTypeEnum.parse(documentType),
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not record the upload.");

      setFile(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded border border-dashed border-ink-200 p-4">
      <div>
        <Label htmlFor="documentType">Document type</Label>
        <select
          id="documentType"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="flex h-10 w-full rounded border border-ink-200 bg-white px-3 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-800"
        >
          {DOCUMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="file">File</Label>
        <input
          id="file"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-ink-600 file:mr-3 file:rounded file:border-0 file:bg-ink-800 file:px-3 file:py-1.5 file:text-sm file:text-white"
        />
        <p className="mt-1 text-xs text-ink-400">PDF, PNG, JPEG, or Word · up to 20MB</p>
      </div>

      {error && <p className="text-sm text-danger-400">{error}</p>}

      <Button size="sm" onClick={handleUpload} disabled={!file || loading}>
        {loading ? "Uploading…" : "Upload document"}
      </Button>
    </div>
  );
}
