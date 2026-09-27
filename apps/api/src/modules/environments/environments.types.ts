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
}

/** The mutable half of an environment: `key` is fixed once applications resolve it. */
export interface EnvironmentDetails {
  name: string;
  description: string | null;
}

/** What giving every flag of a project a configuration in one environment needs to know. */
export interface EnvironmentConfigRequest {
  projectId: string;
  target: EnvironmentRef;
  /** The environment to copy each configuration from; disabled defaults otherwise. */
  source: EnvironmentRef | null;
  author: string;
}

/**
 * Injected by `app.ts`: the flags module owns what a flag is made of, and the
 * environments module never reaches into it to find out.
 */
export type InitializeEnvironmentConfigs = (
  tx: Transaction,
  input: EnvironmentConfigRequest,
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
