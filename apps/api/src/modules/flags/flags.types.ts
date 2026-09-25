import type { FlagStatus, FlagType, FlagVariation } from "@dariise/contracts";

import type { EnvironmentRef } from "../../shared/types/environment.js";
import type { ProjectRef } from "../project-access/index.js";

/** The environment a flag lives in, shared with the environments module. */
export type { EnvironmentRef };

/**
 * A flag row. It belongs to one environment, so its configuration is part of
 * it rather than a separate record that might be missing.
 */
export interface FlagRow {
  id: string;
  projectId: string;
  environmentId: string;
  key: string;
  name: string;
  description: string | null;
  type: string;
  tags: string[];
  owner: string | null;
  status: string;
  enabled: boolean;
  offVariationKey: string;
  defaultVariationKey: string;
  rolloutPercentage: number;
  bucketBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A list row also carries where the flag lives, for the environment badge. */
export interface FlagListRow extends FlagRow {
  environmentKey: string;
  environmentName: string;
}

export interface VariationRow {
  flagId: string;
  key: string;
  name: string;
  value: unknown;
  description: string | null;
  priority: number;
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
  environmentId: string;
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
  userName: string;
}

/** The workspace-wide list orders by (project key, flag key), so its cursor holds both. */
export const WORKSPACE_FLAG_CURSOR_SEPARATOR = "::";

/** One flag's state in one environment, as every environment-scoped method resolves it. */
export interface EnvironmentScope {
  project: ProjectRef;
  flag: FlagRow;
  environment: EnvironmentRef;
}

/** The source flag and the environment it is being copied into. */
export interface FlagCopyInput {
  sourceFlagId: string;
  targetEnvironmentId: string;
}

/** A whole environment's flags, copied into a newly created one. */
export interface EnvironmentFlagCopyInput {
  sourceEnvironmentId: string;
  targetEnvironmentId: string;
}
