/**
 * TEMPORARY STAND-IN — not a real implementation.
 *
 * `apps/api` does not exist yet, so these functions simulate a round-trip to the
 * FastAPI backend so that pending and success states on the segment screens are
 * genuine rather than instantaneous. Nothing is persisted: a reload discards
 * every change, and no SDK ever sees it.
 *
 * When the API lands, replace each body with the corresponding call from
 * `@/lib/api`. This module is the single swap point for segment writes.
 */

import type { SegmentRule } from "@/lib/segment-data";

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

export interface CreateSegmentInput {
  name: string;
  key: string;
  description: string;
  rules: SegmentRule[];
}

export async function createSegment(
  _input: CreateSegmentInput,
  signal?: AbortSignal,
): Promise<void> {
  await simulateLatency(signal);
}

/** Archive a segment. Flags referencing it fall back to their default. */
export async function archiveSegment(
  _key: string,
  signal?: AbortSignal,
): Promise<void> {
  await simulateLatency(signal);
}
