import Link from "next/link";
import { notFound } from "next/navigation";
import { getCaseDetail } from "@/lib/services/cases.service";
import { getSessionUser } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { CaseVerifyActions } from "@/components/forms/case-verify-actions";
import { AssignJudgeForm } from "@/components/forms/assign-judge-form";
import { DocumentReviewRow } from "@/components/forms/document-review-row";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { CaseStatus } from "@/lib/types/database.types";
import { ApiError } from "@/lib/auth/require-role";

export default async function OfficerCaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const session = await getSessionUser();

  let detail;
  try {
    detail = await getCaseDetail(caseId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const supabase = await createClient();
  const { data: judges } = await supabase.from("profiles").select("id, full_name").eq("role", "judge");

  const { case: caseRow, appeal, documents, hearings } = detail;

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
          <CardTitle>Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <CaseVerifyActions
            caseId={caseRow.id}
            isUnclaimed={caseRow.assigned_officer_id === null}
            currentStatus={caseRow.status}
            officerId={session!.id}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Case details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-ink-600">{caseRow.description}</p>
          {appeal && (
            <>
              <p><span className="font-medium text-ink-700">Grounds: </span>{appeal.grounds_for_appeal}</p>
              <p><span className="font-medium text-ink-700">Relief sought: </span>{appeal.relief_sought}</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supporting documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <p className="p-5 text-sm text-ink-500">No documents uploaded yet.</p>
          ) : (
            <ul className="divide-y divide-ink-50">
              {documents.map((d) => (
                <DocumentReviewRow key={d.id} document={d} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign a judge</CardTitle>
        </CardHeader>
        <CardContent>
          <AssignJudgeForm
            caseId={caseRow.id}
            judges={judges ?? []}
            currentJudgeId={caseRow.assigned_judge_id}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hearings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {hearings.length === 0 ? (
            <div className="p-5">
              <p className="mb-3 text-sm text-ink-500">No hearings scheduled yet.</p>
              <Link href={`/officer/hearings/schedule/${caseRow.id}`}>
                <Button size="sm" variant="secondary">
                  Schedule a hearing
                </Button>
              </Link>
            </div>
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
    </div>
  );
}
