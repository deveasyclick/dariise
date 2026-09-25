import {
  environmentSettingsSchema,
  type EnvironmentDetail,
  type EnvironmentSettings,
  type EnvironmentSummary,
} from "@dariise/contracts";

import {
  DEFAULT_ENVIRONMENT_SETTINGS,
  type EnvironmentConnectionUrls,
  type EnvironmentRow,
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
    description: row.description,
    color: row.color,
    isDefault: row.isDefault,
    isProtected: row.isProtected,
    archivedAt: row.archivedAt?.toISOString() ?? null,
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
