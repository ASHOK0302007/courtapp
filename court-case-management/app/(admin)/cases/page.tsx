import Link from "next/link";
import { listAllCasesAdmin } from "@/lib/services/admin.service";
import { Card, CardContent } from "@/components/ui/card";
import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { formatDate } from "@/lib/utils";
import type { CaseStatus } from "@/lib/types/database.types";

export default async function AdminCasesPage() {
  const cases = await listAllCasesAdmin();

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink-900">All cases</h1>
      <p className="mt-1 text-sm text-ink-500">System-wide view across every citizen, officer, and judge.</p>

      <Card className="mt-6">
        <CardContent className="p-0">
          {!cases || cases.length === 0 ? (
            <p className="p-5 text-sm text-ink-500">No cases filed yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3 font-medium">Case</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Filed</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50">
                    <td className="px-5 py-3 font-mono text-xs text-ink-400">{c.case_number}</td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/cases/${c.id}`} className="font-medium text-ink-800 hover:underline">
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
