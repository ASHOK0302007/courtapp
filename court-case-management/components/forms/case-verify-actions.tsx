"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

async function patchStatus(caseId: string, status: string) {
  const res = await fetch(`/api/cases/${caseId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Could not update the case.");
  return json.data;
}

export function CaseVerifyActions({
  caseId,
  isUnclaimed,
  currentStatus,
  officerId,
}: {
  caseId: string;
  isUnclaimed: boolean;
  currentStatus: string;
  officerId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: string, status: string) {
    setError(null);
    setLoading(action);
    try {
      await patchStatus(caseId, status);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  async function claim() {
    setError(null);
    setLoading("claim");
    try {
      const res = await fetch(`/api/cases/${caseId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedOfficerId: officerId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not claim the case.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {isUnclaimed && (
          <Button size="sm" variant="outline" onClick={claim} disabled={loading !== null}>
            {loading === "claim" ? "Claiming…" : "Claim for review"}
          </Button>
        )}
        {currentStatus !== "verified" && (
          <Button size="sm" onClick={() => run("verify", "verified")} disabled={loading !== null}>
            {loading === "verify" ? "Verifying…" : "Verify case"}
          </Button>
        )}
        {currentStatus !== "rejected" && (
          <Button size="sm" variant="danger" onClick={() => run("reject", "rejected")} disabled={loading !== null}>
            {loading === "reject" ? "Rejecting…" : "Reject filing"}
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-danger-400">{error}</p>}
    </div>
  );
}
