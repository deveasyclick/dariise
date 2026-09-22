/**
 * TEMPORARY STAND-IN — not a real implementation.
 *
 * `apps/api` does not exist yet, so these functions simulate a round-trip to the
 * FastAPI backend so that pending and success states on the environment screens
 * are genuine rather than instantaneous. Nothing is persisted: a reload discards
 * every change, and no SDK ever sees it.
 *
 * When the API lands, replace each body with the corresponding call from
 * `@/lib/api`. This module is the single swap point for environment writes.
 */

import type {
  EnvironmentColor,
  EnvironmentSettings,
  InitialFlagStatus,
} from "@/lib/environment-data";

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

export interface CreateEnvironmentInput {
  name: string;
  key: string;
  color: EnvironmentColor;
  /** Environment key that settings and flag states are copied from. */
  copyFrom: string;
  initialFlagStatus: InitialFlagStatus;
}

export interface UpdateEnvironmentSettingsInput {
  key: string;
  settings: EnvironmentSettings;
}

export async function createEnvironment(
  _input: CreateEnvironmentInput,
  signal?: AbortSignal,
): Promise<void> {
  await simulateLatency(signal);
}

export async function updateEnvironmentSettings(
  _input: UpdateEnvironmentSettingsInput,
  signal?: AbortSignal,
): Promise<void> {
  await simulateLatency(signal);
}
