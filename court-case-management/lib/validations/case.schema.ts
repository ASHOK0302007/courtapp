import { z } from "zod";

export const caseTypeEnum = z.enum(["civil", "criminal", "family", "general"]);

/**
 * Filing a new case bundles the case row and its initiating appeal in one
 * submission — matches the "File a new case appeal" citizen flow.
 */
export const fileCaseSchema = z.object({
  title: z.string().trim().min(5, "Give the case a descriptive title").max(200),
  description: z.string().trim().min(20, "Describe the case in at least 20 characters").max(5000),
  caseType: caseTypeEnum,
  groundsForAppeal: z.string().trim().min(20, "Explain the grounds for appeal").max(5000),
  originalJudgmentRef: z.string().trim().max(200).optional().or(z.literal("")),
  reliefSought: z.string().trim().min(5, "Describe the relief sought").max(2000),
});

export type FileCaseInput = z.infer<typeof fileCaseSchema>;

export const caseStatusEnum = z.enum([
  "submitted",
  "under_review",
  "verified",
  "assigned",
  "scheduled",
  "in_hearing",
  "judgment_published",
  "closed",
  "rejected",
  "withdrawn",
]);

export const updateCaseStatusSchema = z.object({
  status: caseStatusEnum,
  reason: z.string().trim().max(1000).optional(),
});

export type UpdateCaseStatusInput = z.infer<typeof updateCaseStatusSchema>;

export const assignCaseSchema = z.object({
  assignedOfficerId: z.string().uuid().optional(),
  assignedJudgeId: z.string().uuid().optional(),
});

export type AssignCaseInput = z.infer<typeof assignCaseSchema>;
