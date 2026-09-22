/**
 * TEMPORARY STAND-IN — not a real implementation.
 *
 * `apps/api` does not exist yet, so these functions simulate a round-trip to the
 * FastAPI backend so that the Settings screens' pending and saved states are
 * genuine rather than instantaneous. Nothing is persisted: a reload discards
 * every change.
 *
 * When the API lands, replace each body with the corresponding call from
 * `@/lib/api`. This module is the single swap point for workspace writes.
 */

import type { SecuritySettings } from "@/lib/settings-data";

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

export interface UpdateWorkspaceProfileInput {
  name: string;
  defaultEnvironmentKey: string;
  timezone: string;
}

export async function updateWorkspaceProfile(
  _input: UpdateWorkspaceProfileInput,
  signal?: AbortSignal,
): Promise<void> {
  await simulateLatency(signal);
}

/** Apply a Security tab change. The screen calls this on every toggle. */
export async function updateWorkspaceSecurity(
  _input: SecuritySettings,
  signal?: AbortSignal,
): Promise<void> {
  await simulateLatency(signal);
}
