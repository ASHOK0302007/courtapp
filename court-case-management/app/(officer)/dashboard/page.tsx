import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { formatDate } from "@/lib/utils";
import type { CaseStatus } from "@/lib/types/database.types";

export default async function OfficerDashboard() {
  const supabase = await createClient();

  // RLS scopes this to unassigned cases plus this officer's own queue.
  const { data: cases } = await supabase
    .from("cases")
    .select("id, case_number, title, status, filed_at, assigned_officer_id")
    .order("filed_at", { ascending: false });

  const unassigned = cases?.filter((c) => c.assigned_officer_id === null).length ?? 0;
  const myQueue = cases?.filter((c) => c.assigned_officer_id !== null).length ?? 0;

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink-900">Case queue</h1>
      <p className="mt-1 text-sm text-ink-500">Verify filings, review documents, and assign cases.</p>

      <div className="my-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-400">Unassigned filings</p>
            <p className="mt-2 font-display text-3xl text-ink-900">{unassigned}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-400">In my queue</p>
            <p className="mt-2 font-display text-3xl text-ink-900">{myQueue}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cases awaiting action</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!cases || cases.length === 0 ? (
            <p className="p-5 text-sm text-ink-500">No cases in the queue.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {cases.slice(0, 10).map((c) => (
                  <tr key={c.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-5 py-3 font-mono text-xs text-ink-400">{c.case_number}</td>
                    <td className="px-5 py-3">
                      <Link href={`/officer/cases/${c.id}`} className="font-medium text-ink-800 hover:underline">
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-400">{formatDate(c.filed_at)}</td>
                    <td className="px-5 py-3">
                      <CaseStatusBadge status={c.status as CaseStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
