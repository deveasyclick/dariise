/**
 * TEMPORARY API KEY MOCK DATA — not connected to anything.
 *
 * `apps/api` does not exist yet, so the API key screens read from the fixtures
 * below, in the same spirit as `environment-data.ts` and `dashboard-data.ts`.
 * Nothing here is fetched or persisted. When the API lands, replace the getters
 * with calls to `@/lib/api`'s `apiKeys` resource and delete this module.
 *
 * Two rules keep the screens honest:
 *
 *  - the full credential exists only in this module, and is masked before it
 *    reaches a screen — `maskApiKey` is the same function the environment
 *    screens use, so the two cannot disagree about how a key is hidden;
 *  - timestamps are "days ago" / "minutes ago" offsets resolved against a
 *    caller-supplied `now`, as everywhere else in the fixtures, so relative
 *    labels stay stable between the server render and client hydration.
 *
 * Every value below is a fake credential. None of them authenticate anything.
 */

import {
  getEnvironmentOptions,
  maskSdkKey,
  type EnvironmentColor,
  type EnvironmentOption,
} from "@/lib/environment-data";
import { formatDate, formatRelativeTime, hoursAgo } from "@/lib/format";
import type { ApiKeyScope } from "@/lib/types";

/** One permission the create screen offers. */
export interface ApiKeyScopeOption {
  value: ApiKeyScope;
  label: string;
  description: string;
}

/** The permissions a key can carry, in the order the design lists them. */
export const apiKeyScopes: ApiKeyScopeOption[] = [
  {
    value: "flags:read",
    label: "Read flags",
    description: "Evaluate flags and stream updates.",
  },
  {
    value: "flags:write",
    label: "Write flags",
    description: "Create and modify flags via the API.",
  },
  {
    value: "segments:read",
    label: "Read segments",
    description: "List segments and their rules.",
  },
  {
    value: "webhooks:manage",
    label: "Manage webhooks",
    description: "Create and update webhook endpoints.",
  },
];

/** Label for a scope, e.g. `flags:read` → `Read flags`. */
export function scopeLabel(scope: ApiKeyScope): string {
  return apiKeyScopes.find((option) => option.value === scope)?.label ?? scope;
}

/**
 * Whether a scope grants a write.
 *
 * Write scopes are tinted in the list so a key that can change configuration is
 * distinguishable at a glance from a read-only one.
 */
export function isWriteScope(scope: ApiKeyScope): boolean {
  return scope === "flags:write" || scope === "webhooks:manage";
}

export type ApiKeyExpiration = "never" | "30d" | "90d" | "1y";

/** Expiry choices offered by the create screen. `null` days means never. */
export const apiKeyExpirations: Array<{
  value: ApiKeyExpiration;
  label: string;
  days: number | null;
}> = [
  { value: "never", label: "Never", days: null },
  { value: "30d", label: "30 days", days: 30 },
  { value: "90d", label: "90 days", days: 90 },
  { value: "1y", label: "1 year", days: 365 },
];

/**
 * A key issued in this browser session.
 *
 * Shape returned by `createApiKey` in `api-key-stub.ts`; it lives here so the
 * data module can turn it into a row without importing the stub.
 */
export interface CreatedApiKey {
  id: string;
  name: string;
  environmentKey: string;
  scopes: ApiKeyScope[];
  /** The secret, available the moment the key is issued and never again. */
  value: string;
  createdAt: string;
  expiresInDays: number | null;
}

/** A key as the list renders it. */
export interface ApiKeyView {
  id: string;
  name: string;
  /** `null` when the key is valid in every environment. */
  environmentKey: string | null;
  environmentName: string;
  /** `null` for a key that is not scoped to a single environment. */
  environmentColor: EnvironmentColor | null;
  scopes: ApiKeyScope[];
  /** Full fixture credential, read only by the copy action. */
  value: string;
  /** Prefix plus four characters, e.g. `ff_prod_8a2c••••••`. */
  masked: string;
  createdLabel: string;
  lastUsedLabel: string;
  /** Set only for a key created in this session. */
  isNew: boolean;
}

/** As stored: the secret, and age offsets rather than absolute dates. */
interface ApiKeySeed {
  id: string;
  name: string;
  environmentKey: string | null;
  scopes: ApiKeyScope[];
  value: string;
  createdDaysAgo: number;
  /** `null` renders as `Never`. */
  lastUsedMinutesAgo: number | null;
}

const apiKeySeeds: ApiKeySeed[] = [
  {
    id: "key_prod_sdk",
    name: "Production SDK",
    environmentKey: "production",
    scopes: ["flags:read"],
    value: "ff_prod_8a2c9f13e7b4d6a9f5c1",
    createdDaysAgo: 6,
    lastUsedMinutesAgo: 2,
  },
  {
    id: "key_staging_sdk",
    name: "Staging SDK",
    environmentKey: "staging",
    scopes: ["flags:read", "flags:write"],
    value: "ff_stg_3e4f5a6b7c8d1e2f3a4b",
    createdDaysAgo: 8,
    lastUsedMinutesAgo: 7 * 60,
  },
  {
    id: "key_mobile_app",
    name: "Mobile App",
    environmentKey: "production",
    scopes: ["flags:read"],
    value: "ff_prod_b7d1e4f7a2c5b8d3e6f9",
    createdDaysAgo: 25,
    lastUsedMinutesAgo: 5,
  },
  {
    id: "key_ci_deploy_bot",
    name: "CI Deploy Bot",
    environmentKey: null,
    scopes: ["flags:read", "flags:write"],
    value: "ff_ci_5c8f2b6e9d3a7c1f4b8e",
    createdDaysAgo: 47,
    lastUsedMinutesAgo: 3 * 24 * 60,
  },
  {
    id: "key_local_dev",
    name: "Local Dev",
    environmentKey: "development",
    scopes: ["flags:read", "flags:write"],
    value: "ff_dev_1a4d7f2c5e8b3d6a9c2f",
    createdDaysAgo: 66,
    lastUsedMinutesAgo: null,
  },
];

/**
 * Mask a credential for display.
 *
 * API keys and SDK keys share the `ff_<environment>_<id>` shape, so they share
 * one mask — the environment screens' — rather than two that could drift.
 */
export const maskApiKey = maskSdkKey;

/** Resolve the environment a key is scoped to, or the all-environments label. */
function environmentFor(
  key: string | null,
  environments: EnvironmentOption[],
): { environmentName: string; environmentColor: EnvironmentColor | null } {
  if (key === null) {
    return { environmentName: "All environments", environmentColor: null };
  }

  const match = environments.find((environment) => environment.key === key);
  return {
    environmentName: match?.name ?? key,
    environmentColor: match?.color ?? null,
  };
}

/**
 * Turn a key issued in this session into a list row.
 *
 * Used by the list screen, which shows it once alongside the keys that already
 * existed.
 */
export function toApiKeyView(
  record: CreatedApiKey,
  environments: EnvironmentOption[],
): ApiKeyView {
  return {
    id: record.id,
    name: record.name,
    environmentKey: record.environmentKey,
    ...environmentFor(record.environmentKey, environments),
    scopes: record.scopes,
    value: record.value,
    masked: maskApiKey(record.value),
    createdLabel: formatDate(record.createdAt),
    lastUsedLabel: "Never",
    isNew: true,
  };
}

/**
 * Build the API key list.
 *
 * @param now - The moment relative labels are measured against. The page passes
 * a single value for the whole render so server and client agree.
 */
export function getApiKeys(now: Date): ApiKeyView[] {
  const environments = getEnvironmentOptions();

  return apiKeySeeds.map((seed) => ({
    id: seed.id,
    name: seed.name,
    environmentKey: seed.environmentKey,
    ...environmentFor(seed.environmentKey, environments),
    scopes: seed.scopes,
    value: seed.value,
    masked: maskApiKey(seed.value),
    createdLabel: formatDate(hoursAgo(seed.createdDaysAgo * 24, now)),
    lastUsedLabel:
      seed.lastUsedMinutesAgo === null
        ? "Never"
        : formatRelativeTime(hoursAgo(seed.lastUsedMinutesAgo / 60, now), now),
    isNew: false,
  }));
}
