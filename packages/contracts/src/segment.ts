import { z } from "zod";

import {
  flagStatusSchema,
  targetingConditionInputSchema,
  targetingConditionSchema,
} from "#flag";
import { paginationQuerySchema } from "#pagination";
import { resourceKeySchema } from "#slug";

const segmentIdentitySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const segmentSummarySchema = segmentIdentitySchema.extend({
  conditionCount: z.number().int().nonnegative(),
});

export type SegmentSummary = z.infer<typeof segmentSummarySchema>;

export const segmentDetailSchema = segmentIdentitySchema.extend({
  conditions: z.array(targetingConditionSchema),
});

export type SegmentDetail = z.infer<typeof segmentDetailSchema>;

export const createSegmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Segment name is required.")
    .max(80, "Segment name must be at most 80 characters."),
  key: resourceKeySchema,
  description: z.string().trim().max(280).nullable().optional(),
  rules: z.array(targetingConditionInputSchema).default([]),
});

export type CreateSegmentInput = z.infer<typeof createSegmentSchema>;

export const updateSegmentSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(280).nullable().optional(),
  rules: z.array(targetingConditionInputSchema).optional(),
});

export type UpdateSegmentInput = z.infer<typeof updateSegmentSchema>;

/** A flag that references this segment, for the segment detail flags tab. */
export const segmentFlagSchema = z.object({
  key: z.string(),
  environmentKey: z.string(),
  status: flagStatusSchema,
  isRollout: z.boolean(),
});

export type SegmentFlag = z.infer<typeof segmentFlagSchema>;

export const segmentArchiveResponseSchema = z.object({
  key: z.string(),
  archivedAt: z.string(),
});

export type SegmentArchiveResponse = z.infer<
  typeof segmentArchiveResponseSchema
>;

export const segmentListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  includeArchived: z.coerce.boolean().optional(),
});

export type SegmentListQuery = z.infer<typeof segmentListQuerySchema>;
