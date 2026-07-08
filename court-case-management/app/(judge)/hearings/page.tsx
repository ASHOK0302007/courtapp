import Link from "next/link";
import { listHearings } from "@/lib/services/hearings.service";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  scheduled: "text-warning-600",
  completed: "text-success-600",
  postponed: "text-brass-600",
  cancelled: "text-danger-600",
};

export default async function JudgeHearingsPage() {
  const hearings = await listHearings();

  return (
    <div>
      <h1 className="font-display text-2xl font-medium text-ink-900">Hearing calendar</h1>
      <p className="mt-1 text-sm text-ink-500">Hearings across your assigned cases.</p>

      <Card className="mt-6">
        <CardContent className="p-0">
          {!hearings || hearings.length === 0 ? (
            <p className="p-5 text-sm text-ink-500">No hearings scheduled yet.</p>
          ) : (
            <ul className="divide-y divide-ink-50">
              {hearings.map((h) => (
                <li key={h.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium text-ink-800">{formatDateTime(h.hearing_date)}</p>
                    <p className="text-ink-400">
                      {/* @ts-expect-error -- joined relation shape from the select("*, cases(...)") */}
                      {h.cases?.title} · {h.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-xs uppercase ${STATUS_STYLES[h.status] ?? ""}`}>
                      {h.status}
                    </span>
                    <Link href={`/judge/cases/${h.case_id}`} className="text-brass-500 hover:underline">
                      Open case
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
