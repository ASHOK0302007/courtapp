import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScheduleHearingForm } from "@/components/forms/schedule-hearing-form";

export default async function ScheduleHearingPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const supabase = await createClient();

  const { data: caseRow } = await supabase.from("cases").select("id, case_number, title").eq("id", caseId).single();
  if (!caseRow) notFound();

  const { data: judges } = await supabase.from("profiles").select("id, full_name").eq("role", "judge");

  return (
    <div className="mx-auto max-w-xl">
      <p className="font-mono text-xs text-ink-400">{caseRow.case_number}</p>
      <h1 className="mt-1 font-display text-2xl font-medium text-ink-900">Schedule a hearing</h1>
      <p className="mt-1 text-sm text-ink-500">{caseRow.title}</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Hearing details</CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleHearingForm caseId={caseRow.id} judges={judges ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
