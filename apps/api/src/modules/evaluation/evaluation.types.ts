import type { EvaluationReason } from "@dariise/contracts";

export interface EvaluationFlag {
  key: string;
  status: string;
}

export interface EvaluationConfig {
  enabled: boolean;
  offVariation: string;
  defaultVariation: string;
  rolloutPercentage: number;
  bucketBy: string;
}

export interface EvaluationCondition {
  attribute: string;
  attributeType: string;
  operator: string;
  values: string[];
}

export interface EvaluationRule {
  id: string;
  conditions: EvaluationCondition[];
  variation: string;
  segmentKeys: string[];
  rolloutPercentage: number | null;
  bucketBy: string | null;
}

export interface EvaluationSegment {
  key: string;
  conditions: EvaluationCondition[];
}

export interface EvaluationTarget {
  userId: string;
  variationKey: string;
}

export interface EvaluationSubject {
  id: string;
  [attribute: string]: string | number | boolean | undefined;
}

export interface EvaluationInput {
  flag: EvaluationFlag;
  config: EvaluationConfig;
  rules: EvaluationRule[];
  targets: EvaluationTarget[];
  segments: EvaluationSegment[];
  subject: EvaluationSubject;
}

export interface EvaluationOutcome {
  flag: string;
  enabled: boolean;
  variation: string;
  reason: EvaluationReason;
  matchedRuleId: string | null;
}

/** The config a flag has in an environment that has no configuration row. */
export const DISABLED_CONFIG: EvaluationConfig = {
  enabled: false,
  offVariation: "off",
  defaultVariation: "on",
  rolloutPercentage: 0,
  bucketBy: "userId",
};

export const OFF_VARIATION = "off";

export const EVALUATION_HASH_VERSION = "v1";
