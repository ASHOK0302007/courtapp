import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadButton } from "@/components/forms/download-button";
import { formatDate } from "@/lib/utils";

export default async function CitizenJudgmentPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const supabase = await createClient();

  const [{ data: caseRow }, { data: judgment }] = await Promise.all([
    supabase.from("cases").select("case_number, title").eq("id", caseId).single(),
    supabase.from("judgments").select("*").eq("case_id", caseId).maybeSingle(),
  ]);

  if (!caseRow || !judgment || !judgment.published_at) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <p className="font-mono text-xs text-ink-400">{caseRow.case_number}</p>
      <h1 className="mt-1 font-display text-2xl font-medium text-ink-900">{caseRow.title}</h1>
      <p className="mt-1 text-xs text-ink-400">Published {formatDate(judgment.published_at)}</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Verdict summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-ink-700">{judgment.verdict_summary}</CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Full judgment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{judgment.full_text}</p>
          {judgment.document_storage_path ? (
            <DownloadButton endpoint={`/api/judgments/${judgment.id}/download`} label="Download PDF" />
          ) : (
            <p className="text-xs text-ink-400">No PDF has been attached to this judgment.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
