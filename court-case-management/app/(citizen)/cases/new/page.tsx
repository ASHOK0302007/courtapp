"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { fileCaseSchema, type FileCaseInput } from "@/lib/validations/case.schema";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CASE_TYPES = [
  { value: "civil", label: "Civil" },
  { value: "criminal", label: "Criminal" },
  { value: "family", label: "Family" },
  { value: "general", label: "General" },
] as const;

export default function NewAppealPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FileCaseInput>({
    resolver: zodResolver(fileCaseSchema),
    defaultValues: { caseType: "general" },
  });

  async function onSubmit(values: FileCaseInput) {
    setFormError(null);
    setLoading(true);

    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setFormError(json.error?.message ?? "Could not file the case.");
      return;
    }

    router.push(`/cases/${json.data.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-medium text-ink-900">File a new appeal</h1>
      <p className="mt-1 text-sm text-ink-500">
        Once submitted, a court officer will verify your filing. You can add supporting documents
        from the case page after it&apos;s created.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Case details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <Label htmlFor="title">Case title</Label>
              <Input id="title" placeholder="e.g. Appeal against zoning permit denial" {...register("title")} />
              <FieldError>{errors.title?.message}</FieldError>
            </div>

            <div>
              <Label htmlFor="caseType">Case type</Label>
              <select
                id="caseType"
                className="flex h-10 w-full rounded border border-ink-200 bg-white px-3 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-800"
                {...register("caseType")}
              >
                {CASE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <FieldError>{errors.caseType?.message}</FieldError>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} {...register("description")} />
              <FieldError>{errors.description?.message}</FieldError>
            </div>

            <div>
              <Label htmlFor="groundsForAppeal">Grounds for appeal</Label>
              <Textarea id="groundsForAppeal" rows={4} {...register("groundsForAppeal")} />
              <FieldError>{errors.groundsForAppeal?.message}</FieldError>
            </div>

            <div>
              <Label htmlFor="originalJudgmentRef">Original judgment reference (optional)</Label>
              <Input id="originalJudgmentRef" {...register("originalJudgmentRef")} />
              <FieldError>{errors.originalJudgmentRef?.message}</FieldError>
            </div>

            <div>
              <Label htmlFor="reliefSought">Relief sought</Label>
              <Textarea id="reliefSought" rows={3} {...register("reliefSought")} />
              <FieldError>{errors.reliefSought?.message}</FieldError>
            </div>

            {formError && <p className="text-sm text-danger-400">{formError}</p>}

            <Button type="submit" disabled={loading}>
              {loading ? "Filing…" : "File appeal"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
