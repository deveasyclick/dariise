import { z } from "zod";

import { emailSchema } from "#fields";
import { workspaceSlugSchema } from "#slug";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required.")
    .max(80, "Workspace name must be at most 80 characters."),
  slug: workspaceSlugSchema,
  // Accepted and validated, but nothing sends them yet: there is no mail transport.
  invites: z.array(emailSchema).max(50).optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

/**
 * The workspace a signed-in user belongs to.
 *
 * `null` on the `/v1/me` response means onboarding is incomplete: the account
 * exists but no workspace has been created, so the dashboard has no project to
 * resolve and must send the user back to step 2.
 */
export const workspaceSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  /** Workspace-level role: `owner`, `admin` or `member`. */
  role: z.string(),
});

export type WorkspaceSummary = z.infer<typeof workspaceSummarySchema>;

/**
 * The workspace as the settings screen renders it. `slug` is immutable: it is
 * part of URLs the user has already shared.
 */
export const workspaceProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  defaultEnvironmentId: z.string().nullable(),
  timezone: z.string(),
});

export type WorkspaceProfile = z.infer<typeof workspaceProfileSchema>;

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required.")
    .max(80, "Workspace name must be at most 80 characters.")
    .optional(),
  /** The environment key, resolved within the workspace's default project. */
  defaultEnvironmentKey: z.string().nullable().optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

export const SESSION_TIMEOUTS = ["1h", "12h", "24h", "7d"] as const;

export const sessionTimeoutSchema = z.enum(SESSION_TIMEOUTS);

export type SessionTimeout = z.infer<typeof sessionTimeoutSchema>;

export const workspaceSecuritySettingsSchema = z.object({
  ssoProvider: z.string().nullable(),
  ssoConnected: z.boolean(),
  twoFactorEnabled: z.boolean(),
  sessionTimeout: sessionTimeoutSchema,
  allowedEmailDomains: z.array(z.string()),
  ipAllowlistConfigured: z.boolean(),
  auditRetentionDays: z.number().int().positive(),
});

export type WorkspaceSecuritySettings = z.infer<
  typeof workspaceSecuritySettingsSchema
>;

export const updateWorkspaceSecuritySchema = workspaceSecuritySettingsSchema;

export type UpdateWorkspaceSecurityInput = z.infer<
  typeof updateWorkspaceSecuritySchema
>;
