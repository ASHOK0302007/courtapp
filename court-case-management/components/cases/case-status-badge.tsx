import { cn, formatCaseStatus } from "@/lib/utils";
import type { CaseStatus } from "@/lib/types/database.types";

const STATUS_STYLES: Record<CaseStatus, string> = {
  submitted: "bg-ink-50 text-ink-700 border-ink-200",
  under_review: "bg-warning-50 text-warning-600 border-warning-400/40",
  verified: "bg-brass-50 text-brass-600 border-brass-400/40",
  assigned: "bg-brass-50 text-brass-600 border-brass-400/40",
  scheduled: "bg-warning-50 text-warning-600 border-warning-400/40",
  in_hearing: "bg-warning-50 text-warning-600 border-warning-400/40",
  judgment_published: "bg-success-50 text-success-600 border-success-400/40",
  closed: "bg-success-50 text-success-600 border-success-400/40",
  rejected: "bg-danger-50 text-danger-600 border-danger-400/40",
  withdrawn: "bg-ink-50 text-ink-500 border-ink-200",
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-xs uppercase tracking-wide",
        STATUS_STYLES[status]
      )}
    >
      {formatCaseStatus(status)}
    </span>
  );
}
