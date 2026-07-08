import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/get-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { CaseStatus } from "@/lib/types/database.types";

export default async function CitizenDashboard() {
  const session = await getSessionUser();
  const supabase = await createClient();

  // RLS restricts this to cases where citizen_id = auth.uid() automatically.
  const { data: cases } = await supabase
    .from("cases")
    .select("id, case_number, title, status, filed_at")
    .order("filed_at", { ascending: false });

  const openCount = cases?.filter((c) => !["closed", "rejected", "withdrawn"].includes(c.status)).length ?? 0;
  const closedCount = cases?.filter((c) => c.status === "closed").length ?? 0;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink-900">
            Welcome back, {session?.profile.full_name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-ink-500">Here&apos;s where your cases stand.</p>
        </div>
        <Link href="/cases/new">
          <Button>File a new appeal</Button>
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-400">Total cases</p>
            <p className="mt-2 font-display text-3xl text-ink-900">{cases?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-400">Open</p>
            <p className="mt-2 font-display text-3xl text-ink-900">{openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-400">Closed</p>
            <p className="mt-2 font-display text-3xl text-ink-900">{closedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent cases</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!cases || cases.length === 0 ? (
            <p className="p-5 text-sm text-ink-500">
              You haven&apos;t filed a case yet. <Link href="/cases/new" className="text-brass-500 hover:underline">File your first appeal</Link>.
            </p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {cases.slice(0, 8).map((c) => (
                  <tr key={c.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-5 py-3 font-mono text-xs text-ink-400">{c.case_number}</td>
                    <td className="px-5 py-3">
                      <Link href={`/cases/${c.id}`} className="font-medium text-ink-800 hover:underline">
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
