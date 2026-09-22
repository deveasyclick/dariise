/**
 * TEMPORARY STAND-IN — not a real implementation.
 *
 * `apps/api` does not exist yet, so these functions simulate the round-trips the
 * Profile screen makes, so that its pending and saved states are genuine rather
 * than instantaneous. Nothing is persisted: a reload discards every change, and
 * no credential is ever checked.
 *
 * These are personal writes, so the real endpoints live under `/v1/me` rather
 * than with the workspace ones in `workspace-stub.ts`. When the API lands,
 * replace each body with the corresponding call from `@/lib/api`.
 */

import type { ProfileNotifications } from "@/lib/profile-data";

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

export interface UpdateProfileInput {
  name: string;
  email: string;
}

export async function updateProfile(
  _input: UpdateProfileInput,
  signal?: AbortSignal,
): Promise<void> {
  await simulateLatency(signal);
}

export interface UpdatePasswordInput {
  current: string;
  next: string;
}

/**
 * Change the password.
 *
 * The current password is deliberately not verified — there is nothing to verify
 * it against yet.
 */
export async function updatePassword(
  _input: UpdatePasswordInput,
  signal?: AbortSignal,
): Promise<void> {
  await simulateLatency(signal);
}

export interface UpdatePreferencesInput {
  theme: string;
  defaultEnvironmentKey: string;
}

/** Apply a Preferences card change. The screen calls this on every change. */
export async function updatePreferences(
  _input: UpdatePreferencesInput,
  signal?: AbortSignal,
): Promise<void> {
  await simulateLatency(signal);
}

export async function updateNotifications(
  _input: ProfileNotifications,
  signal?: AbortSignal,
): Promise<void> {
  await simulateLatency(signal);
}
