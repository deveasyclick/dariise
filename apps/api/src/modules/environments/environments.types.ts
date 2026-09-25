import type { EnvironmentSettings } from "@dariise/contracts";

import type { Transaction } from "../../shared/types/db.js";
import type { EnvironmentRef } from "../../shared/types/environment.js";

export interface EnvironmentRow {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string | null;
  color: string | null;
  isDefault: boolean;
  isProtected: boolean;
  settings: unknown;
  archivedAt: Date | null;
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

/** The mutable half of an environment: `key` is fixed once applications resolve it. */
export interface EnvironmentDetails {
  name: string;
  description: string | null;
}

/** What copying one environment's flags into a new one needs to know. */
export interface FlagCopyRequest {
  projectId: string;
  source: EnvironmentRef;
  target: EnvironmentRef;
  author: string;
}

/**
 * Injected by `app.ts`: the flags module owns what a flag is made of, and the
 * environments module never reaches into it to find out.
 */
export type CopyEnvironmentFlags = (
  tx: Transaction,
  input: FlagCopyRequest,
) => Promise<number>;

export interface EnvironmentActorContext {
  organizationId: string;
  workspaceRole: string;
  userId: string;
  userName: string;
}

export interface EnvironmentConnectionUrls {
  baseUrl: string;
  evalUrl: string;
  streamUrl: string | null;
  maskedKey: string | null;
}

export const DEFAULT_ENVIRONMENT_SETTINGS: EnvironmentSettings = {
  protectedEnvironment: false,
};

/** The environment row as the flag copier needs to see it. */
export function toEnvironmentRef(row: EnvironmentRow): EnvironmentRef {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    isProtected: row.isProtected,
    archivedAt: row.archivedAt,
  };
}
