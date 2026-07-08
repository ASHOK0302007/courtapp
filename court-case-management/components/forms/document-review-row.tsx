"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DocumentRowProps {
  document: {
    id: string;
    file_name: string;
    document_type: string;
    review_status: string;
  };
}

export function DocumentReviewRow({ document }: DocumentRowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(reviewStatus: "approved" | "rejected") {
    setError(null);
    setLoading(reviewStatus);
    try {
      const res = await fetch(`/api/documents/${document.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not update the review.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
      <div>
        <p className="font-medium text-ink-800">{document.file_name}</p>
        <p className="font-mono text-xs uppercase text-ink-400">{document.document_type}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs uppercase text-ink-400">{document.review_status}</span>
        {document.review_status !== "approved" && (
          <Button size="sm" variant="secondary" onClick={() => review("approved")} disabled={loading !== null}>
            {loading === "approved" ? "Saving…" : "Approve"}
          </Button>
        )}
        {document.review_status !== "rejected" && (
          <Button size="sm" variant="outline" onClick={() => review("rejected")} disabled={loading !== null}>
            {loading === "rejected" ? "Saving…" : "Reject"}
          </Button>
        )}
      </div>
      {error && <p className="w-full text-sm text-danger-400">{error}</p>}
    </li>
  );
}
