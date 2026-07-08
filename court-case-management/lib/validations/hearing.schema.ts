import { z } from "zod";

export const scheduleHearingSchema = z.object({
  caseId: z.string().uuid(),
  judgeId: z.string().uuid(),
  hearingDate: z.string().datetime({ message: "Choose a valid date and time" }),
  location: z.string().trim().min(2, "Enter a location or virtual link").max(300),
});

export type ScheduleHearingInput = z.infer<typeof scheduleHearingSchema>;

export const updateHearingSchema = z.object({
  hearingDate: z.string().datetime().optional(),
  location: z.string().trim().min(2).max(300).optional(),
  status: z.enum(["scheduled", "completed", "postponed", "cancelled"]).optional(),
  notes: z.string().trim().max(10000).optional(),
  nextHearingDate: z.string().datetime().optional().nullable(),
});

export type UpdateHearingInput = z.infer<typeof updateHearingSchema>;
