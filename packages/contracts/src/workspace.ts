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
