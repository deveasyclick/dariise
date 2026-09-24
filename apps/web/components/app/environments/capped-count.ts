import type { FlagSummary } from "@dariise/contracts";

/**
 * A count the API only reports as a page.
 *
 * No list endpoint exposes a total, so every count is derived from one capped
 * page. When `nextCursor` is non-null there are more rows than the page carried
 * and the count is a lower bound, which `truncated` records so the label can add
 * a `+` instead of printing a number that was never received.
 */
export interface CappedCount {
  count: number;
  truncated: boolean;
}

export function cappedCount(page: {
  data: readonly unknown[];
  nextCursor: string | null;
}): CappedCount {
  return { count: page.data.length, truncated: page.nextCursor !== null };
}

/** `12`, or `100+` when the API had more rows than the page carried. */
export function countLabel({ count, truncated }: CappedCount): string {
  return `${count}${truncated ? "+" : ""}`;
}

/** How a project's flags resolve in one environment. */
export interface EnvironmentFlagCounts {
  /** Enabled everywhere in the environment. */
  on: CappedCount;
  /** Enabled for part of the traffic. */
  partial: CappedCount;
  /** Not enabled. */
  off: CappedCount;
  /** `on + partial` — the "flags on" figure the project screens quote. */
  enabled: CappedCount;
}

export function environmentFlagCounts(
  flags: readonly FlagSummary[],
  environmentKey: string,
  truncated: boolean,
): EnvironmentFlagCounts {
  let on = 0;
  let partial = 0;
  let off = 0;

  for (const flag of flags) {
    const state = flag.environments.find(
      (environment) => environment.environmentKey === environmentKey,
    );

    if (!state?.enabled) {
      off += 1;
      continue;
    }

    if (state.rolloutPercentage >= 100) on += 1;
    else partial += 1;
  }

  const bound = (count: number): CappedCount => ({ count, truncated });

  return {
    on: bound(on),
    partial: bound(partial),
    off: bound(off),
    enabled: bound(on + partial),
  };
}
