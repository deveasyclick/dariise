import { z } from "zod";

import { paginatedSchema } from "#pagination";
import { resourceKeySchema } from "#slug";

export const environmentKeySchema = resourceKeySchema;

export const environmentSettingsSchema = z.object({
  protectedEnvironment: z.boolean(),
  requireApprovals: z.boolean(),
  singleUseSdkKeys: z.boolean(),
});

export type EnvironmentSettings = z.infer<typeof environmentSettingsSchema>;

export const environmentSummarySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  key: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  isDefault: z.boolean(),
  isProtected: z.boolean(),
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

export const INITIAL_FLAG_STATES = ["all-off", "copy-source", "all-on"] as const;

export const initialFlagStateSchema = z.enum(INITIAL_FLAG_STATES);

export type InitialFlagState = z.infer<typeof initialFlagStateSchema>;

export const createEnvironmentSchema = z.object({
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
  /** Environment whose flag configuration this one starts from. */
  copyFrom: environmentKeySchema.optional(),
  initialFlagStatus: initialFlagStateSchema.default("all-off"),
});

export type CreateEnvironmentInput = z.infer<typeof createEnvironmentSchema>;

export const updateEnvironmentSettingsSchema = environmentSettingsSchema;

export type UpdateEnvironmentSettingsInput = z.infer<
  typeof updateEnvironmentSettingsSchema
>;

/** How a flag resolves in one environment, for the coverage matrix. */
export const flagCoverageStateSchema = z.object({
  kind: z.enum(["on", "off", "percentage"]),
  percentage: z.number().int().min(0).max(100).optional(),
});

export type FlagCoverageState = z.infer<typeof flagCoverageStateSchema>;

export const flagCoverageRowSchema = z.object({
  key: z.string(),
  /** Environment key to that environment's state. */
  states: z.record(z.string(), flagCoverageStateSchema),
});

export type FlagCoverageRow = z.infer<typeof flagCoverageRowSchema>;

export const flagCoveragePageSchema = paginatedSchema(flagCoverageRowSchema);

export type FlagCoveragePage = z.infer<typeof flagCoveragePageSchema>;
