/**
 * TEMPORARY STAND-IN — not a real implementation.
 *
 * `apps/api` does not exist yet, so this module simulates the round-trip that
 * issues an API key, so that the create screen's pending state is genuine
 * rather than instantaneous. Nothing is persisted: the credential is invented in
 * the browser, no request is made, and a reload discards it.
 *
 * `createApiKey` also keeps the key it just issued in memory. That is how the
 * list screen can honour the design's promise that a key is *shown once* — it
 * renders the secret for the session that created it, and never again after a
 * reload. When the API lands, replace every body here with the corresponding
 * call from `@/lib/api`'s `apiKeys` resource and delete this module.
 */

import {
  apiKeyExpirations,
  type ApiKeyExpiration,
  type CreatedApiKey,
} from "@/lib/api-key-data";
import type { ApiKeyScope } from "@/lib/types";

/** Simulated network latency, in milliseconds. */
const SIMULATED_LATENCY_MS = 700;

function simulateLatency(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, SIMULATED_LATENCY_MS);

    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export interface CreateApiKeyInput {
  name: string;
  environmentKey: string;
  scopes: ApiKeyScope[];
  expiration: ApiKeyExpiration;
}

/**
 * First segment of a credential, per environment.
 *
 * The same shape `environment-data.ts` uses for its SDK keys, so a generated key
 * masks correctly with the shared `maskApiKey`.
 */
const keySegments: Record<string, string> = {
  production: "ff_prod",
  staging: "ff_stg",
  development: "ff_dev",
};

/** Invent a credential: `ff_<environment>_<20 hex characters>`. */
function generateSecret(environmentKey: string): string {
  const segment = keySegments[environmentKey] ?? "ff_key";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );

  return `${segment}_${id}`;
}

/** The key issued in this session, if any. Never survives a reload. */
let createdApiKey: CreatedApiKey | null = null;
const listeners = new Set<() => void>();

/** Read the session's key. Stable between creations, for `useSyncExternalStore`. */
export function getCreatedApiKey(): CreatedApiKey | null {
  return createdApiKey;
}

/** Subscribe to changes, as `useSyncExternalStore` expects. */
export function subscribeToCreatedApiKey(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Issue a key from the create screen. */
export async function createApiKey(
  input: CreateApiKeyInput,
  signal?: AbortSignal,
): Promise<CreatedApiKey> {
  await simulateLatency(signal);

  const expiration = apiKeyExpirations.find(
    (option) => option.value === input.expiration,
  );

  createdApiKey = {
    id: `key_${Date.now().toString(36)}`,
    name: input.name,
    environmentKey: input.environmentKey,
    scopes: input.scopes,
    value: generateSecret(input.environmentKey),
    createdAt: new Date().toISOString(),
    expiresInDays: expiration?.days ?? null,
  };

  for (const listener of listeners) listener();

  return createdApiKey;
}
