/**
 * Domain types shared with the Dariise API (apps/api).
 *
 * These mirror the concepts documented in the project README. They are written
 * by hand for now; once the API publishes an OpenAPI schema these can be
 * replaced by generated types from `GET /openapi.json`.
 */

/** ISO-8601 timestamp, e.g. `2026-01-31T09:15:00Z`. */
export type IsoTimestamp = string;

export interface Project {
  id: string;
  key: string;
  name: string;
  description: string | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface Environment {
  id: string;
  projectId: string;
  key: string;
  name: string;
  /** Environments that should not be edited by accident, e.g. production. */
  isProtected: boolean;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export type FlagVariationValue = boolean | string | number;

export interface FlagVariation {
  key: string;
  name: string;
  value: FlagVariationValue;
}

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

export type TargetingOperator = (typeof TARGETING_OPERATORS)[number];

export type TargetingAttributeType =
  | "string"
  | "number"
  | "boolean"
  | "semver"
  | "date";

export interface TargetingCondition {
  attribute: string;
  attributeType: TargetingAttributeType;
  operator: TargetingOperator;
  /** A single value for scalar operators; a list for `in` / `not_in`. */
  values: string[];
}

export interface TargetingRule {
  id: string;
  description: string | null;
  /** Conditions are combined with AND. */
  conditions: TargetingCondition[];
  /** Variation served when the rule matches. */
  variation: string;
  /** Segments referenced by key; membership is treated as one more condition. */
  segmentKeys: string[];
}

export interface Rollout {
  /** Whole percentage between 0 and 100, inclusive. */
  percentage: number;
  /** Attribute hashed to assign a user to a bucket. Defaults to the user id. */
  bucketBy: string;
  /** Variation served to users inside the rollout. */
  variation: string;
}

export type FlagStatus = "active" | "archived";

export interface FeatureFlag {
  id: string;
  projectId: string;
  environmentId: string;
  key: string;
  name: string;
  description: string | null;
  status: FlagStatus;
  /** Default variation when no rule, segment, or rollout matches. */
  defaultVariation: string;
  /** Applies while the flag is off; typically the "off" variation. */
  offVariation: string;
  variations: FlagVariation[];
  rules: TargetingRule[];
  rollout: Rollout | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface Segment {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string | null;
  /** Conditions are combined with AND. */
  conditions: TargetingCondition[];
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export type AuditAction =
  | "project.created"
  | "environment.created"
  | "flag.created"
  | "flag.updated"
  | "flag.enabled"
  | "flag.disabled"
  | "flag.archived"
  | "rollout.updated"
  | "segment.created"
  | "segment.updated"
  | "api_key.created"
  | "api_key.rotated"
  | "api_key.revoked";

export interface AuditLogEntry {
  id: string;
  projectId: string;
  environmentId: string | null;
  action: AuditAction;
  /** Free-form identifier of the actor, e.g. a user id or API key id. */
  actor: string;
  target: string | null;
  /** Field-level changes recorded by the API. */
  changes: Record<string, unknown> | null;
  createdAt: IsoTimestamp;
}

/**
 * Why the evaluation engine produced a given result. Used by the SDK to explain
 * a decision and by the dashboard for debugging.
 */
export type EvaluationReason =
  | "flag_not_found"
  | "flag_archived"
  | "flag_disabled"
  | "targeting_rule"
  | "segment"
  | "percentage_rollout"
  | "default_variation"
  | "error";

/** Response shape of the evaluation API. */
export interface EvaluationResult {
  flag: string;
  enabled: boolean;
  /** Variation key, e.g. `on`, `off`, or a custom variation. */
  variation: string;
  reason: EvaluationReason;
  /** Which rule or segment matched, when applicable. */
  matchedRuleId?: string | null;
}

/** Attributes describing the subject a flag is evaluated for. */
export type EvaluationUserContext = {
  id: string;
  [attribute: string]: string | number | boolean | undefined;
};
