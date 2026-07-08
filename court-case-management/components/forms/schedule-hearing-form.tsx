"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { scheduleHearingSchema, type ScheduleHearingInput } from "@/lib/validations/hearing.schema";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

export function ScheduleHearingForm({
  caseId,
  judges,
}: {
  caseId: string;
  judges: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ScheduleHearingInput>({
    resolver: zodResolver(scheduleHearingSchema),
    defaultValues: { caseId },
  });

  async function onSubmit(values: ScheduleHearingInput) {
    setFormError(null);
    setLoading(true);

    // datetime-local inputs don't include seconds/timezone; normalize to ISO.
    const payload = { ...values, hearingDate: new Date(values.hearingDate).toISOString() };

    const res = await fetch("/api/hearings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setFormError(json.error?.message ?? "Could not schedule the hearing.");
      return;
    }

    router.push(`/officer/cases/${caseId}`);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <input type="hidden" {...register("caseId")} value={caseId} />

      <div>
        <Label htmlFor="judgeId">Judge</Label>
        <select
          id="judgeId"
          className="flex h-10 w-full rounded border border-ink-200 bg-white px-3 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-800"
          {...register("judgeId")}
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
        <FieldError>{errors.judgeId?.message}</FieldError>
      </div>

      <div>
        <Label htmlFor="hearingDate">Date &amp; time</Label>
        <Input id="hearingDate" type="datetime-local" {...register("hearingDate")} />
        <FieldError>{errors.hearingDate?.message}</FieldError>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input id="location" placeholder="Courtroom 4B or a video link" {...register("location")} />
        <FieldError>{errors.location?.message}</FieldError>
      </div>

      {formError && <p className="text-sm text-danger-400">{formError}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Scheduling…" : "Schedule hearing"}
      </Button>
    </form>
  );
}
