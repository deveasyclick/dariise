import type { EnvironmentSettings } from "@dariise/contracts";

export interface EnvironmentRow {
  id: string;
  projectId: string;
  key: string;
  name: string;
  color: string | null;
  isDefault: boolean;
  isProtected: boolean;
  settings: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewEnvironmentRecord {
  id: string;
  projectId: string;
  key: string;
  name: string;
  color: string | null;
  isDefault: boolean;
  isProtected: boolean;
  settings: EnvironmentSettings;
}

export interface FlagRef {
  id: string;
  key: string;
}

export interface FlagConfigRecord {
  flagId: string;
  environmentId: string;
  enabled: boolean;
  offVariationKey: string;
  defaultVariationKey: string;
  rolloutPercentage: number;
  bucketBy: string;
}

export interface VariationRecord {
  flagId: string;
  environmentId: string;
  key: string;
  name: string;
  value: unknown;
  description: string | null;
  priority: number;
}

export interface CoverageConfigRow {
  flagId: string;
  environmentKey: string;
  enabled: boolean;
  rolloutPercentage: number;
}

export interface EnvironmentActorContext {
  organizationId: string;
  workspaceRole: string;
  userId: string;
}

export interface EnvironmentConnectionUrls {
  baseUrl: string;
  evalUrl: string;
  streamUrl: string | null;
  maskedKey: string | null;
}

export const DEFAULT_ENVIRONMENT_SETTINGS: EnvironmentSettings = {
  protectedEnvironment: false,
  requireApprovals: false,
  singleUseSdkKeys: false,
};

/** Every new environment starts a flag with the same on/off pair. */
export const DEFAULT_VARIATIONS = [
  { key: "on", name: "On", value: true, priority: 0 },
  { key: "off", name: "Off", value: false, priority: 1 },
] as const;

export const DEFAULT_ROLLOUT_BUCKET = "userId";
