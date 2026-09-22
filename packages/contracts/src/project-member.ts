import { z } from "zod";

import { emailSchema } from "#fields";

export const PROJECT_ROLES = ["owner", "admin", "engineer", "viewer"] as const;

export const projectRoleSchema = z.enum(PROJECT_ROLES);

export type ProjectRole = z.infer<typeof projectRoleSchema>;

export const projectMemberSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string(),
  name: z.string(),
  email: emailSchema,
  role: projectRoleSchema,
  createdAt: z.string(),
});

export type ProjectMember = z.infer<typeof projectMemberSchema>;

export const addProjectMemberSchema = z.object({
  userId: z.string().min(1, "Choose a member to add."),
  role: projectRoleSchema,
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;

export const updateProjectMemberSchema = z.object({
  role: projectRoleSchema,
});

export type UpdateProjectMemberInput = z.infer<
  typeof updateProjectMemberSchema
>;
