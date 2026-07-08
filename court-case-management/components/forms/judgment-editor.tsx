"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { draftJudgmentSchema, type DraftJudgmentInput } from "@/lib/validations/judgment.schema";
import { Button } from "@/components/ui/button";
import { Label, Textarea, Input, FieldError } from "@/components/ui/input";

interface ExistingJudgment {
  id: string;
  verdict_summary: string;
  full_text: string;
  published_at: string | null;
}

export function JudgmentEditor({
  caseId,
  existing,
}: {
  caseId: string;
  existing: ExistingJudgment | null;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DraftJudgmentInput>({
    resolver: zodResolver(draftJudgmentSchema),
    defaultValues: {
      caseId,
      verdictSummary: existing?.verdict_summary ?? "",
      fullText: existing?.full_text ?? "",
    },
  });

  async function saveDraft(values: DraftJudgmentInput) {
    setFormError(null);
    setLoading("save");
    try {
      const res = existing
        ? await fetch(`/api/judgments/${existing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ verdictSummary: values.verdictSummary, fullText: values.fullText }),
          })
        : await fetch("/api/judgments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not save the judgment.");
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  async function publish() {
    if (!existing) return;
    setFormError(null);
    setLoading("publish");
    try {
      const res = await fetch(`/api/judgments/${existing.id}/publish`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not publish the judgment.");
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  if (existing?.published_at) {
    return (
      <div className="space-y-2 text-sm">
        <p className="font-mono text-xs uppercase tracking-wide text-success-600">Published</p>
        <p className="text-ink-700">{existing.verdict_summary}</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(saveDraft)} noValidate>
      <input type="hidden" {...register("caseId")} value={caseId} />
      <div>
        <Label htmlFor="verdictSummary">Verdict summary</Label>
        <Input id="verdictSummary" {...register("verdictSummary")} />
        <FieldError>{errors.verdictSummary?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="fullText">Full judgment text</Label>
        <Textarea id="fullText" rows={8} {...register("fullText")} />
        <FieldError>{errors.fullText?.message}</FieldError>
      </div>

      {formError && <p className="text-sm text-danger-400">{formError}</p>}

      <div className="flex gap-2">
        <Button type="submit" variant="outline" disabled={loading !== null}>
          {loading === "save" ? "Saving…" : existing ? "Update draft" : "Save draft"}
        </Button>
        {existing && (
          <Button type="button" onClick={publish} disabled={loading !== null}>
            {loading === "publish" ? "Publishing…" : "Publish judgment"}
          </Button>
        )}
      </div>
    </form>
  );
}
