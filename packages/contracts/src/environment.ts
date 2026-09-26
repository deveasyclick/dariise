import { z } from "zod";

import { paginationQuerySchema } from "#pagination";
import { booleanQueryParamSchema } from "#query";
import { resourceKeySchema } from "#slug";

export const environmentKeySchema = resourceKeySchema;

export const environmentSettingsSchema = z.object({
  /**
   * Flag changes here are staged as a change request that a second person
   * approves, instead of being applied directly.
   */
  protectedEnvironment: z.boolean(),
});

export type EnvironmentSettings = z.infer<typeof environmentSettingsSchema>;

export const environmentSummarySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  isDefault: z.boolean(),
  isProtected: z.boolean(),
  /** Set once the environment is archived; archive is reversible, delete is not. */
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type EnvironmentSummary = z.infer<typeof environmentSummarySchema>;

/**
 * Where an SDK reaches this environment. `maskedKey` is display metadata for
 * the SDKs & Integration screen; the full secret is never part of it.
 * `streamUrl` stays null until flag streaming exists, so the screen never
 * advertises an endpoint the API does not serve.
 */
export const environmentConnectionSchema = z.object({
  baseUrl: z.string(),
  evalUrl: z.string(),
  streamUrl: z.string().nullable(),
  maskedKey: z.string().nullable(),
});

export type EnvironmentConnection = z.infer<typeof environmentConnectionSchema>;

export const environmentDetailSchema = environmentSummarySchema.extend({
  settings: environmentSettingsSchema,
  connection: environmentConnectionSchema,
});

export type EnvironmentDetail = z.infer<typeof environmentDetailSchema>;

export const INITIAL_FLAG_STATES = ["all-off", "copy-source"] as const;

export const initialFlagStateSchema = z.enum(INITIAL_FLAG_STATES);

export type InitialFlagState = z.infer<typeof initialFlagStateSchema>;

/**
 * How a new environment's flag configurations start.
 *
 * Every flag of the project gets a configuration here either way, because a flag
 * is project-scoped. `all-off` writes them disabled, so the environment is
 * complete and serving nothing; `copy-source` copies one environment's
 * configurations, including their rules and individual targets.
 */
export const createEnvironmentSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Environment name is required.")
      .max(60, "Environment name must be at most 60 characters."),
    key: environmentKeySchema,
    color: z
      .string()
      .trim()
      .min(1, "Colour is required when provided.")
      .max(40, "Colour must be at most 40 characters.")
      .optional(),
    /** Environment to copy every flag's configuration from. Required by `copy-source`. */
    copyFrom: environmentKeySchema.optional(),
    initialFlagStatus: initialFlagStateSchema.default("all-off"),
  })
  .superRefine((input, ctx) => {
    if (input.initialFlagStatus === "copy-source" && !input.copyFrom) {
      ctx.addIssue({
        code: "custom",
        path: ["copyFrom"],
        message: "Choose the environment to copy configurations from.",
      });
    }

    if (input.initialFlagStatus === "all-off" && input.copyFrom) {
      ctx.addIssue({
        code: "custom",
        path: ["copyFrom"],
        message:
          "Configurations are only copied when the environment starts from one.",
      });
    }
  });

export type CreateEnvironmentInput = z.infer<typeof createEnvironmentSchema>;

/**
 * Identity only. The key is absent on purpose: applications already resolve
 * this environment through it, so it is fixed for the environment's lifetime.
 */
export const updateEnvironmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Environment name is required.")
    .max(60, "Environment name must be at most 60 characters."),
  description: z.string().trim().max(280).nullable().optional(),
});

export type UpdateEnvironmentInput = z.infer<typeof updateEnvironmentSchema>;

export const environmentListQuerySchema = paginationQuerySchema.extend({
  includeArchived: booleanQueryParamSchema.optional(),
});

export type EnvironmentListQuery = z.infer<typeof environmentListQuerySchema>;

export const updateEnvironmentSettingsSchema = environmentSettingsSchema;

export type UpdateEnvironmentSettingsInput = z.infer<
  typeof updateEnvironmentSettingsSchema
>;
