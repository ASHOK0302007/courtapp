"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";

export function AssignJudgeForm({
  caseId,
  judges,
  currentJudgeId,
}: {
  caseId: string;
  judges: { id: string; full_name: string }[];
  currentJudgeId: string | null;
}) {
  const router = useRouter();
  const [judgeId, setJudgeId] = useState(currentJudgeId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    if (!judgeId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedJudgeId: judgeId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not assign a judge.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Label htmlFor="judge-select">Assign judge</Label>
      <div className="flex gap-2">
        <select
          id="judge-select"
          value={judgeId}
          onChange={(e) => setJudgeId(e.target.value)}
          className="flex h-10 w-full rounded border border-ink-200 bg-white px-3 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-800"
        >
          <option value="" disabled>
            Select a judge
          </option>
          {judges.map((j) => (
            <option key={j.id} value={j.id}>
              {j.full_name}
            </option>
          ))}
        </select>
        <Button size="md" onClick={handleAssign} disabled={loading || !judgeId}>
          {loading ? "Assigning…" : "Assign"}
        </Button>
      </div>
      {error && <p className="mt-1 text-sm text-danger-400">{error}</p>}
    </div>
  );
}
