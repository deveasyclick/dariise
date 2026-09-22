import {
  environmentSettingsSchema,
  type EnvironmentDetail,
  type EnvironmentSettings,
  type EnvironmentSummary,
  type FlagCoverageRow,
  type FlagCoverageState,
} from "@dariise/contracts";

import {
  DEFAULT_ENVIRONMENT_SETTINGS,
  type CoverageConfigRow,
  type EnvironmentConnectionUrls,
  type EnvironmentRow,
  type FlagRef,
} from "./environments.types.js";

/** The settings column is jsonb: validate on read so a bad row cannot leak. */
export function toEnvironmentSettings(value: unknown): EnvironmentSettings {
  const parsed = environmentSettingsSchema.safeParse(value);

  return parsed.success ? parsed.data : DEFAULT_ENVIRONMENT_SETTINGS;
}

export function toEnvironmentSummary(
  row: EnvironmentRow,
): EnvironmentSummary {
  return {
    id: row.id,
    projectId: row.projectId,
    key: row.key,
    name: row.name,
    color: row.color,
    isDefault: row.isDefault,
    isProtected: row.isProtected,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toEnvironmentDetail(
  row: EnvironmentRow,
  connection: EnvironmentConnectionUrls,
): EnvironmentDetail {
  return {
    ...toEnvironmentSummary(row),
    settings: toEnvironmentSettings(row.settings),
    connection,
  };
}

function toCoverageState(
  config: CoverageConfigRow | undefined,
): FlagCoverageState {
  if (!config?.enabled) return { kind: "off" };

  if (config.rolloutPercentage <= 0 || config.rolloutPercentage >= 100) {
    return { kind: "on" };
  }

  return { kind: "percentage", percentage: config.rolloutPercentage };
}

/**
 * One row per flag, one state per environment. A flag with no configuration in
 * an environment is simply off there, which is what a missing row means.
 */
export function toCoverageRows(
  flags: FlagRef[],
  environmentKeys: string[],
  configs: CoverageConfigRow[],
): FlagCoverageRow[] {
  const byFlag = new Map<string, Map<string, CoverageConfigRow>>();

  for (const config of configs) {
    const forFlag = byFlag.get(config.flagId) ?? new Map();

    forFlag.set(config.environmentKey, config);
    byFlag.set(config.flagId, forFlag);
  }

  return flags.map((flag) => {
    const forFlag = byFlag.get(flag.id);

    return {
      key: flag.key,
      states: Object.fromEntries(
        environmentKeys.map((environmentKey) => [
          environmentKey,
          toCoverageState(forFlag?.get(environmentKey)),
        ]),
      ),
    };
  });
}
