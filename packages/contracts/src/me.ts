import { z } from "zod";

import { displayNameSchema, emailSchema, passwordSchema } from "#fields";

export const THEMES = ["system", "light", "dark"] as const;

export const themeSchema = z.enum(THEMES);

export type Theme = z.infer<typeof themeSchema>;

export const updateProfileSchema = z.object({
  name: displayNameSchema,
  email: emailSchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updatePreferencesSchema = z.object({
  theme: themeSchema,
  /** `null` clears the preference and falls back to the project default. */
  defaultEnvironmentKey: z.string().nullable(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

export const updateNotificationsSchema = z.object({
  flagChanges: z.boolean(),
  weeklyDigest: z.boolean(),
  incidentAlerts: z.boolean(),
});

export type UpdateNotificationsInput = z.infer<
  typeof updateNotificationsSchema
>;

export const userPreferencesSchema = z.object({
  theme: themeSchema,
  defaultProjectId: z.string().nullable(),
  defaultEnvironmentId: z.string().nullable(),
  notifications: updateNotificationsSchema,
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
