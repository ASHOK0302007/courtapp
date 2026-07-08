"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";

interface HearingNotesFormProps {
  hearing: {
    id: string;
    notes: string | null;
    status: string;
  };
}

export function HearingNotesForm({ hearing }: HearingNotesFormProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(hearing.notes ?? "");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>, action: string) {
    setError(null);
    setLoading(action);
    try {
      const res = await fetch(`/api/hearings/${hearing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not update the hearing.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`notes-${hearing.id}`}>Hearing notes</Label>
        <Textarea
          id={`notes-${hearing.id}`}
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => patch({ notes }, "save")} disabled={loading !== null}>
          {loading === "save" ? "Saving…" : "Save notes"}
        </Button>
        {hearing.status !== "completed" && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => patch({ notes, status: "completed" }, "complete")}
            disabled={loading !== null}
          >
            {loading === "complete" ? "Saving…" : "Mark completed"}
          </Button>
        )}
        {hearing.status !== "postponed" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => patch({ status: "postponed" }, "postpone")}
            disabled={loading !== null}
          >
            {loading === "postpone" ? "Saving…" : "Postpone"}
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-danger-400">{error}</p>}
    </div>
  );
}
