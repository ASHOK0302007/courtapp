import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { Button } from "@/components/ui/button";
import { DocumentUploader } from "@/components/forms/document-uploader";
import { DownloadButton } from "@/components/forms/download-button";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { CaseStatus } from "@/lib/types/database.types";

export default async function CitizenCaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const supabase = await createClient();

  const { data: caseRow } = await supabase.from("cases").select("*").eq("id", caseId).single();
  if (!caseRow) notFound();

  const [{ data: appeal }, { data: documents }, { data: hearings }, { data: judgment }] = await Promise.all([
    supabase.from("appeals").select("*").eq("case_id", caseId).maybeSingle(),
    supabase.from("documents").select("*").eq("case_id", caseId).order("uploaded_at", { ascending: false }),
    supabase.from("hearings").select("*").eq("case_id", caseId).order("hearing_date", { ascending: true }),
    supabase.from("judgments").select("*").eq("case_id", caseId).maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-ink-400">{caseRow.case_number}</p>
          <h1 className="mt-1 font-display text-2xl font-medium text-ink-900">{caseRow.title}</h1>
        </div>
        <CaseStatusBadge status={caseRow.status as CaseStatus} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Case details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-ink-600">{caseRow.description}</p>
          <p className="text-ink-400">Filed {formatDate(caseRow.filed_at)}</p>
        </CardContent>
      </Card>

      {appeal && (
        <Card>
          <CardHeader>
            <CardTitle>Appeal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium text-ink-700">Grounds: </span>{appeal.grounds_for_appeal}</p>
            <p><span className="font-medium text-ink-700">Relief sought: </span>{appeal.relief_sought}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Supporting documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!documents || documents.length === 0 ? (
            <p className="text-sm text-ink-500">No documents uploaded yet.</p>
          ) : (
            <ul className="divide-y divide-ink-50 rounded border border-ink-50">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <span className="text-ink-700">{d.file_name}</span>
                    <span className="ml-2 font-mono text-xs uppercase text-ink-400">{d.review_status}</span>
                  </div>
                  <DownloadButton endpoint={`/api/documents/${d.id}/download`} label="Download" />
                </li>
              ))}
            </ul>
          )}
          <DocumentUploader caseId={caseRow.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hearing dates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!hearings || hearings.length === 0 ? (
            <p className="p-5 text-sm text-ink-500">No hearings scheduled yet.</p>
          ) : (
            <ul className="divide-y divide-ink-50">
              {hearings.map((h) => (
                <li key={h.id} className="px-5 py-3 text-sm">
                  <p className="font-medium text-ink-800">{formatDateTime(h.hearing_date)}</p>
                  <p className="text-ink-400">{h.location}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {judgment?.published_at && (
        <Card>
          <CardHeader>
            <CardTitle>Judgment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-ink-600">{judgment.verdict_summary}</p>
            <Link href={`/judgments/${caseRow.id}`}>
              <Button variant="outline" size="sm">
                View full judgment
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
