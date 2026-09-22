import type {
  FlagStatus,
  FlagType,
  FlagVariation,
} from "@dariise/contracts";

export interface FlagRow {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string | null;
  type: string;
  tags: string[];
  owner: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnvironmentRef {
  id: string;
  key: string;
  name: string;
}

export interface FlagConfigRow {
  flagId: string;
  environmentId: string;
  enabled: boolean;
  offVariationKey: string;
  defaultVariationKey: string;
  rolloutPercentage: number;
  bucketBy: string;
}

export interface VariationRow {
  flagId: string;
  environmentId: string;
  key: string;
  name: string;
  value: unknown;
  description: string | null;
  priority: number;
}

export interface EnvironmentConfigSummary {
  flagId: string;
  environmentId: string;
  environmentKey: string;
  environmentName: string;
  enabled: boolean;
  rolloutPercentage: number;
}

export interface EnvironmentConfigDetail {
  environment: EnvironmentRef;
  config: FlagConfigRow;
  variations: VariationRow[];
  rules: RuleWithConditions[];
  targets: IndividualTargetRow[];
}

export interface FlagListFilter {
  search?: string;
  status?: FlagStatus;
  limit: number;
  cursor: string | null;
}

export interface NewFlagRecord {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string | null;
  type: FlagType;
  tags: string[];
  owner: string | null;
}

export interface UpdateFlagRecord {
  name?: string;
  description?: string | null;
  tags?: string[];
  owner?: string | null;
}

export interface UpdateConfigRecord {
  enabled: boolean;
  offVariation: string;
  defaultVariation: string;
  rolloutPercentage: number;
  bucketBy: string;
  variations: FlagVariation[];
}

export interface FlagVersionRecord {
  flagId: string;
  projectId: string;
  version: number;
  description: string | null;
  author: string;
  snapshot: unknown;
}

export interface FlagVersionSummary {
  version: number;
  description: string | null;
  author: string;
  snapshot: unknown;
  createdAt: Date;
}

export interface TargetingRuleRow {
  id: string;
  flagId: string;
  environmentId: string;
  priority: number;
  description: string | null;
  variationKey: string;
  segmentKeys: string[];
  rolloutPercentage: number | null;
  bucketBy: string | null;
}

export interface TargetingConditionRow {
  id: string;
  ruleId: string;
  attribute: string;
  attributeType: string;
  operator: string;
  values: unknown;
  priority: number;
}

export interface RuleWithConditions {
  rule: TargetingRuleRow;
  conditions: TargetingConditionRow[];
}

export interface IndividualTargetRow {
  flagId: string;
  environmentId: string;
  userId: string;
  variationKey: string;
}

export interface DependencyRow {
  key: string;
  requires: string;
  referencedIn: string | null;
}

export interface FlagStatusRef {
  key: string;
  status: string;
}

/** What the session gate resolved, passed from the controller to the service. */
export interface FlagsActorContext {
  organizationId: string;
  workspaceRole: string;
  userId: string;
}

/** The workspace-wide list orders by (project key, flag key), so its cursor holds both. */
export const WORKSPACE_FLAG_CURSOR_SEPARATOR = "::";

