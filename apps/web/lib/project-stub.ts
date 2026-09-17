/**
 * TEMPORARY PROJECT WRITE STAND-IN — not a real implementation.
 *
 * `apps/api` does not exist yet, so the screens that create a project simulate a
 * round-trip to the FastAPI backend, which is what makes their pending and
 * success states genuine rather than instantaneous. Nothing is persisted: a
 * reload discards every change, and the project never appears in the fixtures.
 *
 * When the API lands, replace the body with the corresponding call from
 * `@/lib/api` (for example `request("POST", "/v1/projects", { body })`). This
 * module is the single swap point for project writes.
 */

import type { EnvironmentColor } from "@/lib/environment-data";

/** How a new project's flags start out. See the create screen. */
export type InitialFlagState = "all-off" | "copy-source" | "all-on";

export interface CreateProjectInput {
  name: string;
  /**
   * Slug used in API paths. The onboarding step, which asks only for a name and
   * an environment, leaves it out — the dashboard wizard always sends one.
   */
  key?: string;
  color?: EnvironmentColor;
  /** Preset key from `environmentPresets`; defaults to the first preset. */
  preset?: string;
  initialFlagState?: InitialFlagState;
  /** Environment flags resolve in. */
  defaultEnvironment?: string;
  /** Whether new members should land in this project. */
  setAsDefault?: boolean;
  /** Onboarding step only: the single environment the project is created with. */
  environmentName?: string;
}

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

/** Create a project, its environments and its first flag states. */
export async function createProject(
  _input: CreateProjectInput,
  signal?: AbortSignal,
): Promise<void> {
  await simulateLatency(signal);
}
