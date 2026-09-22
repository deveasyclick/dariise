import type {
  FlagDetail,
  FlagIndividualTarget,
  FlagStatus,
  FlagSummary,
  FlagType,
  FlagVariation,
  FlagVariationValue,
  FlagVersion,
  TargetingAttributeType,
  TargetingCondition,
  TargetingOperator,
  TargetingRule,
  WorkspaceFlagSummary,
} from "@dariise/contracts";

import type {
  EnvironmentConfigDetail,
  EnvironmentConfigSummary,
  FlagRow,
  FlagVersionSummary,
  RuleWithConditions,
  VariationRow,
} from "./flags.types.js";

function toVariationValue(value: unknown): FlagVariationValue {
  if (typeof value === "boolean" || typeof value === "number") return value;

  return typeof value === "string" ? value : JSON.stringify(value);
}

function toConditionValues(value: unknown): string[] {
  if (!Array.isArray(value)) return value === null ? [] : [String(value)];

  return value.map((entry) => String(entry));
}

/** jsonb comes back as `unknown`; the wire contract only allows scalars. */
export function toVariation(row: VariationRow): FlagVariation {
  return {
    key: row.key,
    name: row.name,
    value: toVariationValue(row.value),
    description: row.description,
  };
}

function toVariations(rows: VariationRow[]): FlagVariation[] {
  return rows.map(toVariation);
}

export function toTargetingRule(entry: RuleWithConditions): TargetingRule {
  return {
    id: entry.rule.id,
    description: entry.rule.description,
    conditions: entry.conditions.map(
      (condition): TargetingCondition => ({
        id: condition.id,
        attribute: condition.attribute,
        attributeType: condition.attributeType as TargetingAttributeType,
        operator: condition.operator as TargetingOperator,
        values: toConditionValues(condition.values),
      }),
    ),
    variation: entry.rule.variationKey,
    segmentKeys: entry.rule.segmentKeys,
    rollout:
      entry.rule.rolloutPercentage === null
        ? null
        : {
            percentage: entry.rule.rolloutPercentage,
            bucketBy: entry.rule.bucketBy ?? "userId",
          },
  };
}

export function toIndividualTargets(
  targets: Array<{ userId: string; variationKey: string }>,
): FlagIndividualTarget[] {
  return targets.map((target) => ({
    userId: target.userId,
    variationKey: target.variationKey,
  }));
}

/** The variation a publish served, when the snapshot recorded one. */
function serveFromSnapshot(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object" || !("serve" in snapshot)) {
    return null;
  }

  const serve = (snapshot as { serve: unknown }).serve;

  return typeof serve === "string" ? serve : null;
}

export function toFlagVersion(row: FlagVersionSummary): FlagVersion {
  return {
    version: row.version,
    description: row.description,
    author: row.author,
    serve: serveFromSnapshot(row.snapshot),
    createdAt: row.createdAt.toISOString(),
  };
}

function toIdentity(row: FlagRow) {
  return {
    id: row.id,
    projectId: row.projectId,
    key: row.key,
    name: row.name,
    description: row.description,
    type: row.type as FlagType,
    tags: row.tags,
    owner: row.owner,
    status: row.status as FlagStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * A list row carries the flag's identity plus one summary per environment, so
 * the list screen can show where a flag is on without a request per row.
 */
export function toFlagSummary(
  row: FlagRow,
  configs: EnvironmentConfigSummary[],
): FlagSummary {
  return {
    ...toIdentity(row),
    environments: configs
      .filter((config) => config.flagId === row.id)
      .map((config) => ({
        environmentKey: config.environmentKey,
        environmentName: config.environmentName,
        enabled: config.enabled,
        rolloutPercentage: config.rolloutPercentage,
      })),
  };
}

/** The workspace-wide list needs the project key: flag keys collide across projects. */
export function toWorkspaceFlagSummary(
  row: FlagRow,
  projectKey: string,
  configs: EnvironmentConfigSummary[],
): WorkspaceFlagSummary {
  return { ...toFlagSummary(row, configs), projectKey };
}

export function toFlagDetail(
  row: FlagRow,
  environments: EnvironmentConfigDetail[],
): FlagDetail {
  return {
    ...toIdentity(row),
    environments: environments.map((entry) => ({
      environmentKey: entry.environment.key,
      environmentName: entry.environment.name,
      enabled: entry.config.enabled,
      offVariation: entry.config.offVariationKey,
      defaultVariation: entry.config.defaultVariationKey,
      rolloutPercentage: entry.config.rolloutPercentage,
      bucketBy: entry.config.bucketBy,
      variations: toVariations(entry.variations),
      rules: entry.rules.map(toTargetingRule),
      individualTargets: toIndividualTargets(entry.targets),
    })),
  };
}
