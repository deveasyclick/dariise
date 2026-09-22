import type { ApiKeyKind, ApiKeyScope } from "@dariise/contracts";

export interface ApiKeyRow {
  id: string;
  projectId: string;
  environmentId: string | null;
  environmentKey: string | null;
  kind: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
}

export interface NewApiKeyRecord {
  id: string;
  projectId: string;
  environmentId: string | null;
  kind: ApiKeyKind;
  name: string;
  prefix: string;
  secretHash: string;
  scopes: ApiKeyScope[];
  expiresAt: Date | null;
}

export interface ApiKeyListFilter {
  includeRevoked: boolean;
  limit: number;
  cursor: string | null;
}

export interface EnvironmentRef {
  id: string;
  key: string;
}

export interface ApiKeyActorContext {
  organizationId: string;
  workspaceRole: string;
  userId: string;
}

export const DEFAULT_API_KEY_KIND: ApiKeyKind = "management";

export const API_KEY_PREFIX_BYTES = 4;
export const API_KEY_SECRET_BYTES = 24;
