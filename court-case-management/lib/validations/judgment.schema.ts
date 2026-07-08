import { z } from "zod";

export const draftJudgmentSchema = z.object({
  caseId: z.string().uuid(),
  verdictSummary: z.string().trim().min(10, "Summarize the verdict").max(500),
  fullText: z.string().trim().min(50, "Enter the full judgment text").max(50000),
});

export type DraftJudgmentInput = z.infer<typeof draftJudgmentSchema>;

export const publishJudgmentSchema = z.object({
  judgmentId: z.string().uuid(),
});

export type PublishJudgmentInput = z.infer<typeof publishJudgmentSchema>;
