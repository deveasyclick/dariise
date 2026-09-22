import { z } from "zod";

/**
 * `POST /v1/projects`.
 *
 * The project key is deliberately absent: it is derived from the name and
 * de-duplicated on the server, because it is an implementation detail of the
 * API paths that the user never types again.
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required.")
    .max(80, "Project name must be at most 80 characters."),
  /** Flags, SDK keys and rollouts all resolve inside one environment. */
  environmentName: z
    .string()
    .trim()
    .min(1, "Environment name is required.")
    .max(60, "Environment name must be at most 60 characters."),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const projectSummarySchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  environmentName: z.string(),
});

export type ProjectSummary = z.infer<typeof projectSummarySchema>;

/**
 * The project as the list and detail screens render it. `environmentCount` is
 * derived server-side so the list costs one request rather than one per row.
 */
export const projectSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  ownerTeam: z.string().nullable(),
  environmentName: z.string(),
  defaultEnvironmentId: z.string().nullable(),
  environmentCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Project = z.infer<typeof projectSchema>;

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required.")
    .max(80, "Project name must be at most 80 characters.")
    .optional(),
  description: z.string().trim().max(280).nullable().optional(),
  color: z.string().trim().min(1).max(40).nullable().optional(),
  ownerTeam: z.string().trim().min(1).max(80).nullable().optional(),
  /** The environment key, resolved within the project. */
  defaultEnvironmentKey: z.string().nullable().optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const projectListQuerySchema = z.object({
  search: z.string().trim().optional(),
});

export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;
