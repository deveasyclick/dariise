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
