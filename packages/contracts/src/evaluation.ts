import { z } from "zod";

export const EVALUATION_REASONS = [
  "flag_not_found",
  "flag_archived",
  "flag_disabled",
  "targeting_rule",
  "segment",
  "percentage_rollout",
  "default_variation",
  "error",
] as const;

export const evaluationReasonSchema = z.enum(EVALUATION_REASONS);

export type EvaluationReason = z.infer<typeof evaluationReasonSchema>;

/** The subject a flag is evaluated for: an id plus arbitrary attributes. */
export const evaluationUserContextSchema = z
  .object({
    id: z.string().min(1, "A user id is required."),
  })
  .catchall(z.union([z.string(), z.number(), z.boolean()]));

export type EvaluationUserContext = z.infer<typeof evaluationUserContextSchema>;

/**
 * The SDK contract. The dashboard calls the same endpoint to explain why a user
 * received a particular variation.
 */
export const evaluateRequestSchema = z.object({
  flag: z.string().min(1, "A flag key is required."),
  environment: z.string().min(1, "An environment key is required."),
  /**
   * Optional because the SDK only knows its own key. The dashboard may send it
   * to disambiguate: the same flag and environment keys can exist in two
   * projects of one workspace.
   */
  projectKey: z.string().optional(),
  user: evaluationUserContextSchema,
});

export type EvaluateRequest = z.infer<typeof evaluateRequestSchema>;

export const evaluationResultSchema = z.object({
  flag: z.string(),
  /** True when the served variation is not the off variation. */
  enabled: z.boolean(),
  variation: z.string(),
  reason: evaluationReasonSchema,
  matchedRuleId: z.string().nullable().optional(),
});

export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
