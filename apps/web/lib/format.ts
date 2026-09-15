/**
 * Small display formatters for the dashboard.
 *
 * Relative labels are derived from an explicit `now` rather than reading the
 * clock, so a Server Component render and the client hydration that follows it
 * always agree.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Format an ISO timestamp as a short relative label, e.g. `2h ago`. */
export function formatRelativeTime(iso: string, now: Date): string {
  const elapsed = now.getTime() - new Date(iso).getTime();

  if (elapsed < 0) return "just now";
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;

  const days = Math.floor(elapsed / DAY);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/** Resolve an "hours ago" fixture offset against `now`. */
export function hoursAgo(hours: number, now: Date): string {
  return new Date(now.getTime() - hours * HOUR).toISOString();
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Format a request count compactly, e.g. `182K`. */
export function formatCompactNumber(value: number): string {
  return compactFormatter.format(value);
}

/** `+3` / `-3` / `No change`. */
export function formatDelta(delta: number): string {
  if (delta === 0) return "No change";
  return `${delta > 0 ? "+" : ""}${delta} this week`;
}
