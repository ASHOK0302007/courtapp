import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCaseStatus } from "@/lib/utils";

// Admin dashboard reads through the service-role client because it needs a
// system-wide view across every citizen's cases — the `cases: admin full
// access` RLS policy would also allow this via the regular server client,
// but the service-role client avoids an extra round trip through
// current_role() on every row for a full-table aggregate like this.
export default async function AdminDashboard() {
  const supabase = createAdminClient();

  const { count: totalCases } = await supabase.from("cases").select("*", { count: "exact", head: true });
  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { data: statusRows } = await supabase.from("cases").select("status");

  const statusCounts = (statusRows ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink-900">System overview</h1>
      <p className="mt-1 text-sm text-ink-500">Case volume and account activity across the docket.</p>

      <div className="my-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-400">Total cases</p>
            <p className="mt-2 font-display text-3xl text-ink-900">{totalCases ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-400">Registered users</p>
            <p className="mt-2 font-display text-3xl text-ink-900">{totalUsers ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-400">Statuses tracked</p>
            <p className="mt-2 font-display text-3xl text-ink-900">{Object.keys(statusCounts).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cases by status</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-ink-50">
            {Object.entries(statusCounts).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="font-medium text-ink-800">{formatCaseStatus(status)}</span>
                <span className="font-mono text-ink-500">{count}</span>
              </li>
            ))}
            {Object.keys(statusCounts).length === 0 && (
              <li className="px-5 py-3 text-sm text-ink-500">No cases filed yet.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
