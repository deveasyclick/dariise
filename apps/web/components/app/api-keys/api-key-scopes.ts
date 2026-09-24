import { API_KEY_SCOPES, type ApiKeyScope } from "@dariise/contracts";

export interface ApiKeyScopeOption {
  value: ApiKeyScope;
  label: string;
  description: string;
}

const scopeCopy: Record<ApiKeyScope, { label: string; description: string }> = {
  "flags:read": {
    label: "Read flags",
    description: "Evaluate flags and stream updates.",
  },
  "flags:write": {
    label: "Write flags",
    description: "Create and modify flags via the API.",
  },
  "segments:read": {
    label: "Read segments",
    description: "List segments and their rules.",
  },
  "webhooks:manage": {
    label: "Manage webhooks",
    description: "Create and update webhook endpoints.",
  },
};

export const API_KEY_SCOPE_OPTIONS: ApiKeyScopeOption[] = API_KEY_SCOPES.map(
  (value) => ({ value, ...scopeCopy[value] }),
);

export function scopeLabel(scope: ApiKeyScope): string {
  return scopeCopy[scope].label;
}

export function isWriteScope(scope: ApiKeyScope): boolean {
  return scope === "flags:write" || scope === "webhooks:manage";
}
