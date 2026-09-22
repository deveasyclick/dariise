import { z } from "zod";

import { paginationQuerySchema } from "#pagination";
import { resourceKeySchema } from "#slug";

export const FLAG_TYPES = ["boolean", "string", "number", "json"] as const;

export const flagTypeSchema = z.enum(FLAG_TYPES);

export type FlagType = z.infer<typeof flagTypeSchema>;

export const FLAG_STATUSES = ["active", "archived"] as const;

export const flagStatusSchema = z.enum(FLAG_STATUSES);

export type FlagStatus = z.infer<typeof flagStatusSchema>;

/**
 * The targeting vocabulary on the wire.
 *
 * Kept identical to `TARGETING_OPERATORS` in `apps/web/lib/types.ts`. The
 * display strings used by the flag and segment screens ("is one of", "matches")
 * are presentation, and the web app maps them to these values.
 */
export const TARGETING_OPERATORS = [
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "in",
  "not_in",
  "greater_than",
  "greater_than_or_equal",
  "less_than",
  "less_than_or_equal",
  "matches_regex",
] as const;

export const targetingOperatorSchema = z.enum(TARGETING_OPERATORS);

export type TargetingOperator = z.infer<typeof targetingOperatorSchema>;

export const TARGETING_ATTRIBUTE_TYPES = [
  "string",
  "number",
  "boolean",
  "semver",
  "date",
] as const;

export const targetingAttributeTypeSchema = z.enum(TARGETING_ATTRIBUTE_TYPES);

export type TargetingAttributeType = z.infer<
  typeof targetingAttributeTypeSchema
>;

export const flagVariationValueSchema = z.union([
  z.boolean(),
  z.string(),
  z.number(),
]);

export type FlagVariationValue = z.infer<typeof flagVariationValueSchema>;

export const flagVariationSchema = z.object({
  key: z.string().min(1, "Variation key is required."),
  name: z.string().min(1, "Variation name is required."),
  value: flagVariationValueSchema,
  description: z.string().nullable(),
});

export type FlagVariation = z.infer<typeof flagVariationSchema>;

export const targetingConditionSchema = z.object({
  id: z.string(),
  attribute: z.string().min(1, "Attribute is required."),
  attributeType: targetingAttributeTypeSchema,
  operator: targetingOperatorSchema,
  /** One value for scalar operators, many for `in` and `not_in`. */
  values: z.array(z.string()),
});

export type TargetingCondition = z.infer<typeof targetingConditionSchema>;

export const targetingConditionInputSchema = targetingConditionSchema.omit({
  id: true,
});

export type TargetingConditionInput = z.infer<
  typeof targetingConditionInputSchema
>;

/** A whole-flag percentage rollout. */
export const rolloutSchema = z.object({
  percentage: z.number().int().min(0).max(100),
  bucketBy: z.string().min(1),
  variation: z.string().min(1),
});

export type Rollout = z.infer<typeof rolloutSchema>;

/** The partial rollout a single targeting rule can carry. */
export const ruleRolloutSchema = z.object({
  percentage: z.number().int().min(0).max(100),
  bucketBy: z.string().min(1),
});

export type RuleRollout = z.infer<typeof ruleRolloutSchema>;

export const targetingRuleSchema = z.object({
  id: z.string(),
  description: z.string().nullable(),
  conditions: z.array(targetingConditionSchema),
  variation: z.string().min(1),
  segmentKeys: z.array(z.string()),
  rollout: ruleRolloutSchema.nullable(),
});

export type TargetingRule = z.infer<typeof targetingRuleSchema>;

export const targetingRuleInputSchema = z.object({
  description: z.string().nullable().optional(),
  conditions: z.array(targetingConditionInputSchema),
  variation: z.string().min(1, "A variation to serve is required."),
  segmentKeys: z.array(z.string()).default([]),
  rollout: ruleRolloutSchema.nullable().optional(),
});

export type TargetingRuleInput = z.infer<typeof targetingRuleInputSchema>;

export const flagIndividualTargetSchema = z.object({
  userId: z.string().min(1),
  variationKey: z.string().min(1),
});

export type FlagIndividualTarget = z.infer<
  typeof flagIndividualTargetSchema
>;

export const flagDependencyNodeSchema = z.object({
  key: z.string(),
  status: flagStatusSchema,
  isSelf: z.boolean(),
});

export type FlagDependencyNode = z.infer<typeof flagDependencyNodeSchema>;

export const flagDependencyGraphSchema = z.object({
  upstream: z.array(z.string()),
  downstream: z.array(z.string()),
  summary: z.object({
    upstream: z.number().int().nonnegative(),
    downstream: z.number().int().nonnegative(),
    circular: z.boolean(),
    maxDepth: z.number().int().nonnegative(),
  }),
  evaluationOrder: z.array(flagDependencyNodeSchema),
});

export type FlagDependencyGraph = z.infer<typeof flagDependencyGraphSchema>;

const flagIdentitySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: flagTypeSchema,
  tags: z.array(z.string()),
  owner: z.string().nullable(),
  status: flagStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const flagEnvironmentSummarySchema = z.object({
  environmentKey: z.string(),
  environmentName: z.string(),
  enabled: z.boolean(),
  rolloutPercentage: z.number().int().min(0).max(100),
});

export type FlagEnvironmentSummary = z.infer<
  typeof flagEnvironmentSummarySchema
>;

export const flagEnvironmentConfigSchema = z.object({
  environmentKey: z.string(),
  environmentName: z.string(),
  enabled: z.boolean(),
  offVariation: z.string(),
  defaultVariation: z.string(),
  rolloutPercentage: z.number().int().min(0).max(100),
  bucketBy: z.string(),
  variations: z.array(flagVariationSchema),
  rules: z.array(targetingRuleSchema),
  individualTargets: z.array(flagIndividualTargetSchema),
});

export type FlagEnvironmentConfig = z.infer<
  typeof flagEnvironmentConfigSchema
>;

/**
 * A flag is one project-scoped entity; its state is per environment. The list
 * carries a summary per environment, the detail screen the full configuration.
 */
export const flagSummarySchema = flagIdentitySchema.extend({
  environments: z.array(flagEnvironmentSummarySchema),
});

export type FlagSummary = z.infer<typeof flagSummarySchema>;

export const flagDetailSchema = flagIdentitySchema.extend({
  environments: z.array(flagEnvironmentConfigSchema),
});

export type FlagDetail = z.infer<typeof flagDetailSchema>;

export const flagVersionSchema = z.object({
  version: z.number().int().positive(),
  description: z.string().nullable(),
  author: z.string(),
  serve: z.string().nullable(),
  createdAt: z.string(),
});

export type FlagVersion = z.infer<typeof flagVersionSchema>;

export const createFlagSchema = z.object({
  key: resourceKeySchema,
  name: z
    .string()
    .trim()
    .min(1, "Flag name is required.")
    .max(80, "Flag name must be at most 80 characters."),
  description: z.string().trim().max(280).nullable().optional(),
  type: flagTypeSchema.default("boolean"),
  tags: z.array(z.string().trim().min(1)).default([]),
  owner: z.string().trim().min(1).nullable().optional(),
});

export type CreateFlagInput = z.infer<typeof createFlagSchema>;

export const updateFlagSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(280).nullable().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  owner: z.string().trim().min(1).nullable().optional(),
});

export type UpdateFlagInput = z.infer<typeof updateFlagSchema>;

export const updateFlagConfigSchema = z.object({
  enabled: z.boolean(),
  offVariation: z.string().min(1),
  defaultVariation: z.string().min(1),
  rolloutPercentage: z.number().int().min(0).max(100),
  bucketBy: z.string().min(1),
  variations: z.array(flagVariationSchema).min(1),
});

export type UpdateFlagConfigInput = z.infer<typeof updateFlagConfigSchema>;

export const replaceTargetingRulesSchema = z.object({
  rules: z.array(targetingRuleInputSchema),
});

export type ReplaceTargetingRulesInput = z.infer<
  typeof replaceTargetingRulesSchema
>;

export const replaceIndividualTargetsSchema = z.object({
  targets: z.array(flagIndividualTargetSchema),
});

export type ReplaceIndividualTargetsInput = z.infer<
  typeof replaceIndividualTargetsSchema
>;

export const flagListQuerySchema = paginationQuerySchema.extend({
  /** Case-insensitive match on key or name. */
  search: z.string().trim().optional(),
  status: flagStatusSchema.optional(),
});

export type FlagListQuery = z.infer<typeof flagListQuerySchema>;

/**
 * The workspace-wide list renders outside any project, and flag keys are unique
 * per project rather than per workspace, so each row carries its project key.
 */
export const workspaceFlagSummarySchema = flagSummarySchema.extend({
  projectKey: z.string(),
});

export type WorkspaceFlagSummary = z.infer<typeof workspaceFlagSummarySchema>;

export const workspaceFlagListQuerySchema = flagListQuerySchema.extend({
  projectKey: z.string().optional(),
});

export type WorkspaceFlagListQuery = z.infer<
  typeof workspaceFlagListQuerySchema
>;
