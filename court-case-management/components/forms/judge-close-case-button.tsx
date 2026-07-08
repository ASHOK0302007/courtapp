"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function JudgeCloseCaseButton({ caseId, currentStatus }: { caseId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (currentStatus === "closed" || currentStatus === "judgment_published") return null;

  async function close() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not close the case.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button size="sm" variant="danger" onClick={close} disabled={loading}>
        {loading ? "Closing…" : "Close case without judgment"}
      </Button>
      {error && <p className="mt-1 text-sm text-danger-400">{error}</p>}
    </div>
  );
}
