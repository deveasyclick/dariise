import type {
  ApiKey,
  ApiKeyScope,
  EnvironmentSummary,
} from "@dariise/contracts";
import {
  resolveEnvironmentColor,
  type EnvironmentColor,
} from "@/lib/environment-color";
import { formatDate, formatRelativeTime } from "@/lib/format";

export interface EnvironmentOption {
  key: string;
  name: string;
  color: EnvironmentColor;
}

export interface ApiKeyView {
  id: string;
  name: string;
  /** Non-secret identifier the API returns; the secret is never in a list row. */
  prefix: string;
  /** `null` when the key is valid in every environment. */
  environmentKey: string | null;
  environmentName: string;
  environmentColor: EnvironmentColor | null;
  scopes: ApiKeyScope[];
  createdLabel: string;
  lastUsedLabel: string;
  isNew: boolean;
}

export function toEnvironmentOptions(
  environments: EnvironmentSummary[],
): EnvironmentOption[] {
  return environments.map((environment) => ({
    key: environment.key,
    name: environment.name,
    color: resolveEnvironmentColor(environment.color),
  }));
}

export function toApiKeyView(
  key: ApiKey,
  environments: EnvironmentOption[],
  now: Date,
  isNew = false,
): ApiKeyView {
  const environment =
    key.environmentKey === null
      ? null
      : (environments.find((item) => item.key === key.environmentKey) ?? null);

  return {
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    environmentKey: key.environmentKey,
    environmentName:
      key.environmentKey === null
        ? "All environments"
        : (environment?.name ?? key.environmentKey),
    environmentColor: environment?.color ?? null,
    scopes: key.scopes,
    createdLabel: formatDate(key.createdAt),
    lastUsedLabel: key.lastUsedAt
      ? formatRelativeTime(key.lastUsedAt, now)
      : "Never",
    isNew,
  };
}
