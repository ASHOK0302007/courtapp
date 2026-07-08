import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  verified: "Verified",
  assigned: "Assigned",
  scheduled: "Scheduled",
  in_hearing: "In hearing",
  judgment_published: "Judgment published",
  closed: "Closed",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function formatCaseStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
