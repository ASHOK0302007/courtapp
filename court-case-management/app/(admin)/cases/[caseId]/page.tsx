import { notFound } from "next/navigation";
import { getCaseDetail } from "@/lib/services/cases.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { CaseStatus } from "@/lib/types/database.types";
import { ApiError } from "@/lib/auth/require-role";

export default async function AdminCaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  let detail;
  try {
    detail = await getCaseDetail(caseId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const { case: caseRow, appeal, documents, hearings, judgment } = detail;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-ink-400">{caseRow.case_number}</p>
          <h1 className="mt-1 font-display text-2xl font-medium text-ink-900">{caseRow.title}</h1>
          <p className="mt-1 text-xs text-ink-400">Filed {formatDate(caseRow.filed_at)}</p>
        </div>
        <CaseStatusBadge status={caseRow.status as CaseStatus} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Case details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-ink-600">{caseRow.description}</p>
          {appeal && <p><span className="font-medium text-ink-700">Grounds: </span>{appeal.grounds_for_appeal}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-ink-50">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-ink-700">{d.file_name}</span>
                <span className="font-mono text-xs uppercase text-ink-400">{d.review_status}</span>
              </li>
            ))}
            {documents.length === 0 && <li className="px-5 py-3 text-sm text-ink-500">No documents.</li>}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hearings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-ink-50">
            {hearings.map((h) => (
              <li key={h.id} className="px-5 py-3 text-sm">
                <p className="font-medium text-ink-800">{formatDateTime(h.hearing_date)}</p>
                <p className="text-ink-400">{h.location}</p>
              </li>
            ))}
            {hearings.length === 0 && <li className="px-5 py-3 text-sm text-ink-500">No hearings.</li>}
          </ul>
        </CardContent>
      </Card>

      {judgment && (
        <Card>
          <CardHeader>
            <CardTitle>Judgment</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-ink-600">{judgment.verdict_summary}</CardContent>
        </Card>
      )}
    </div>
  );
}
