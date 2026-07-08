import { z } from "zod";

export const userRoleEnum = z.enum(["citizen", "court_officer", "judge", "admin"]);

export const createUserSchema = z.object({
  fullName: z.string().trim().min(2, "Enter a full name").max(120),
  email: z.string().trim().email("Enter a valid email address"),
  role: userRoleEnum,
  barOrBadgeId: z.string().trim().max(50).optional().or(z.literal("")),
  // Temporary password the admin sets; the new user should change it on
  // first login (or the admin sends them a password-reset link instead).
  temporaryPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  role: userRoleEnum.optional(),
  isActive: z.boolean().optional(),
  barOrBadgeId: z.string().trim().max(50).optional().or(z.literal("")),
  fullName: z.string().trim().min(2).max(120).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
