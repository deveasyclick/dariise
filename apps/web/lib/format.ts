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

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/**
 * Format an ISO timestamp as a calendar date, e.g. `Sep 10, 2026`.
 *
 * Used where a relative label would be unhelpful — SDK key creation dates are
 * quoted to an auditor, so the exact day matters.
 */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Format a request count compactly, e.g. `182K`. */
export function formatCompactNumber(value: number): string {
  return compactFormatter.format(value);
}

const integerFormatter = new Intl.NumberFormat("en-US");

/** Group a whole number, e.g. `128,940`. */
export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

/** A percentage with a fixed number of decimals, e.g. `0.02%`. */
export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

/** A percentage change with its sign, e.g. `+12.4%`. */
export function formatSignedPercent(value: number, fractionDigits = 1): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(fractionDigits)}%`;
}

const clockFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

/** A wall-clock time, e.g. `6:12 AM`. Used by the audit log timeline. */
export function formatClockTime(iso: string): string {
  return clockFormatter.format(new Date(iso));
}

const time24Formatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * An absolute date and time, e.g. `Sep 15, 2026 05:31`.
 *
 * Composed from the two formatters rather than one, because a single `en-US`
 * date-time pattern inserts a comma between the date and the time.
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${dateFormatter.format(date)} ${time24Formatter.format(date)}`;
}

const monthYearFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

/**
 * A calendar month, e.g. `Jan 2024`.
 *
 * Used where the day would be noise — a membership date is quoted to the month.
 */
export function formatMonthYear(iso: string): string {
  return monthYearFormatter.format(new Date(iso));
}

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", { dateStyle: "short" });

/**
 * The day heading an audit entry belongs under: `Today`, `Yesterday`, or the
 * calendar date.
 *
 * Both sides are reduced to a calendar-day key in the same timezone, so a
 * heading can never disagree with the clock time rendered beside it.
 */
export function formatDayLabel(iso: string, now: Date): string {
  const dayKey = dayKeyFormatter.format(new Date(iso));
  if (dayKey === dayKeyFormatter.format(now)) return "Today";
  if (dayKey === dayKeyFormatter.format(new Date(now.getTime() - DAY))) {
    return "Yesterday";
  }

  return formatDate(iso);
}
