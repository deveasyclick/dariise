/**
 * TEMPORARY STAND-IN — not a real authentication implementation.
 *
 * `apps/api` does not exist yet, so these functions simulate a round-trip to the
 * FastAPI backend so that the forms' pending and success states are genuine
 * rather than instantaneous. Nothing is persisted, no session, cookie or token
 * is created, and no route is protected.
 *
 * When the API lands, replace each body with the corresponding call from
 * `@/lib/api` (for example `request("POST", "/v1/auth/sign-in", { body })`).
 * This module is the single swap point; the form components need no changes.
 */

/** Simulated network latency, in milliseconds. */
const SIMULATED_LATENCY_MS = 700;

/** Sleep for the simulated latency, honouring cancellation. */
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

export interface SignInInput {
  email: string;
  password: string;
  remember: boolean;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
  website: string;
  receiveProductUpdates: boolean;
}

/** Providers offered by the OAuth buttons on the access screens. */
export type OAuthProvider = "github" | "google";

export async function signIn(
  _input: SignInInput,
  signal?: AbortSignal,
): Promise<void> {
  await simulateLatency(signal);
}

/**
 * Sign the current user out.
 *
 * There is no session to end yet, so this acknowledges the round-trip and
 * nothing else; the caller returns to the access screens. It exists here rather
 * than as a dead control because faking this round-trip is exactly what this
 * module is for.
 */
export async function signOut(signal?: AbortSignal): Promise<void> {
  await simulateLatency(signal);
}

/** Simulates starting the OAuth handshake for a provider. */
export async function signInWithProvider(
  _provider: OAuthProvider,
  signal?: AbortSignal,
): Promise<void> {
  await simulateLatency(signal);
}

export async function signUp(
  _input: SignUpInput,
  signal?: AbortSignal,
): Promise<void> {
  await simulateLatency(signal);
}

export async function requestPasswordReset(
  _email: string,
  signal?: AbortSignal,
): Promise<void> {
  await simulateLatency(signal);
}

export async function createWorkspace(
  _input: CreateWorkspaceInput,
  signal?: AbortSignal,
): Promise<void> {
  await simulateLatency(signal);
}
