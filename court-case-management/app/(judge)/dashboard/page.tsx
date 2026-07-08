import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { formatDateTime } from "@/lib/utils";
import type { CaseStatus } from "@/lib/types/database.types";

export default async function JudgeDashboard() {
  const supabase = await createClient();

  // RLS scopes this to cases assigned to the current judge.
  const { data: cases } = await supabase
    .from("cases")
    .select("id, case_number, title, status")
    .order("filed_at", { ascending: false });

  const { data: upcomingHearings } = await supabase
    .from("hearings")
    .select("id, case_id, hearing_date, location, status")
    .eq("status", "scheduled")
    .order("hearing_date", { ascending: true })
    .limit(5);

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink-900">Assigned cases</h1>
      <p className="mt-1 text-sm text-ink-500">Review cases, record hearing notes, and publish judgments.</p>

      <div className="my-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My caseload</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!cases || cases.length === 0 ? (
              <p className="p-5 text-sm text-ink-500">No cases assigned yet.</p>
            ) : (
              <ul className="divide-y divide-ink-50">
                {cases.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <Link href={`/judge/cases/${c.id}`} className="font-medium text-ink-800 hover:underline">
                      {c.title}
                    </Link>
                    <CaseStatusBadge status={c.status as CaseStatus} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming hearings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!upcomingHearings || upcomingHearings.length === 0 ? (
              <p className="p-5 text-sm text-ink-500">No hearings scheduled.</p>
            ) : (
              <ul className="divide-y divide-ink-50">
                {upcomingHearings.map((h) => (
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
    </div>
  );
}
