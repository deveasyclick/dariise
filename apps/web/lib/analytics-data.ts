/**
 * TEMPORARY ANALYTICS MOCK DATA — not connected to anything.
 *
 * `apps/api` does not exist yet, so the Analytics screen reads from the fixtures
 * below, in the same spirit as `dashboard-data.ts` and `environment-data.ts`.
 * Nothing here is fetched or persisted. When the API lands, replace
 * `getAnalyticsData` with calls to `@/lib/api` and delete this module.
 *
 * The design's figures are transcribed rather than invented. Two are derived so
 * they cannot drift:
 *
 *  - every day's total is the sum of its environment values, never stored twice;
 *  - the legend percentages come from `sharePercentages`, so they always add up
 *    to 100.
 *
 * The 24-hour cards and the seven-day chart describe different windows, exactly
 * as the design does; the bar values are bare numbers in the design's unit, so
 * the unit is documented here instead of being guessed on screen.
 */

import type { EnvironmentColor } from "@/lib/environment-data";

export type AnalyticsStatId =
  | "evaluations"
  | "throughput"
  | "users"
  | "error-rate";

/** A change against the previous period, e.g. `+12.4% vs last week`. */
export interface AnalyticsStatDelta {
  kind: "delta";
  percent: number;
  label: string;
}

/** A plain caption instead of a trend, e.g. `18:40 UTC`. */
export interface AnalyticsStatNote {
  kind: "note";
  text: string;
  tone: "muted" | "ok";
}

export type AnalyticsStatMeta = AnalyticsStatDelta | AnalyticsStatNote;

export interface AnalyticsStat {
  id: AnalyticsStatId;
  /** Caption under the value, e.g. `Evaluations · 24h`. */
  label: string;
  value: number;
  valueFormat: "compact" | "integer" | "rate" | "percent";
  /** Decimal places for `percent` values. Ignored by the other formats. */
  fractionDigits?: number;
  /** Whether a rising number is good — colours the trend. */
  positiveIsGood: boolean;
  meta: AnalyticsStatMeta;
}

/** One environment in a chart's series. */
export interface EvaluationSeriesEntry {
  envKey: string;
  label: string;
  color: EnvironmentColor;
}

/** One day of the chart, as stored: the day's total is derived from `values`. */
interface EvaluationPointSeed {
  label: string;
  values: Record<string, number>;
}

/** One day of the chart, resolved: `total` sums `values`. */
export interface EvaluationPoint {
  label: string;
  total: number;
  values: Record<string, number>;
}

export interface EvaluationSeries {
  /** Stack order, bottom to top. */
  series: EvaluationSeriesEntry[];
  points: EvaluationPoint[];
  /** Scale of the values and of the totals printed above each bar. */
  unit: "M";
}

export interface LatencySummary {
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  windowHours: number;
}

/** One environment's share of the last 24 hours of evaluations. */
export interface EnvironmentShare {
  envKey: string;
  label: string;
  color: EnvironmentColor;
  value: number;
}

export interface TopFlag {
  key: string;
  value: number;
}

export interface AnalyticsData {
  stats: AnalyticsStat[];
  series: EvaluationSeries;
  latency: LatencySummary;
  last24Hours: { total: number; rows: EnvironmentShare[] };
  topFlags: TopFlag[];
}

/** Bottom-to-top stack order, and the legend order, in every chart. */
const series: EvaluationSeriesEntry[] = [
  { envKey: "production", label: "Production", color: "primary" },
  { envKey: "staging", label: "Staging", color: "purple" },
  { envKey: "development", label: "Development", color: "cyan" },
];

/**
 * Seven days in the design's unit.
 *
 * Each day keeps the design's roughly 46 / 33 / 21 split across the three
 * environments, so the stack heights match the mock while the totals stay
 * derived.
 */
const pointSeeds: EvaluationPointSeed[] = [
  { label: "Mon", values: { production: 33.1, staging: 23.8, development: 15.1 } },
  { label: "Tue", values: { production: 44.2, staging: 31.7, development: 20.1 } },
  { label: "Wed", values: { production: 29.4, staging: 21.1, development: 13.5 } },
  { label: "Thu", values: { production: 50.6, staging: 36.3, development: 23.1 } },
  { label: "Fri", values: { production: 60.7, staging: 43.6, development: 27.7 } },
  { label: "Sat", values: { production: 40.5, staging: 29.0, development: 18.5 } },
  { label: "Sun", values: { production: 53.4, staging: 38.3, development: 24.3 } },
];

/** The last 24 hours, which the headline card and the donut both read. */
const last24HourRows: EnvironmentShare[] = [
  { ...series[0], value: 22_200_000 },
  { ...series[1], value: 15_900_000 },
  { ...series[2], value: 10_100_000 },
];

const latency: LatencySummary = {
  avgMs: 7,
  p50Ms: 4,
  p95Ms: 11,
  p99Ms: 24,
  windowHours: 24,
};

/** Flags the design ranks; every key exists in the flag fixtures. */
const topFlags: TopFlag[] = [
  { key: "checkout-v2", value: 9_800_000 },
  { key: "new-dashboard", value: 7_100_000 },
  { key: "dark-mode", value: 5_400_000 },
  { key: "search-ranking", value: 4_200_000 },
  { key: "payments-v2", value: 2_900_000 },
];

/**
 * Round a set of shares to whole percentages that add up to 100.
 *
 * Rounding each share on its own can leave a legend reading 99% or 101%; the
 * largest-remainder method puts the leftover points on the biggest shares.
 */
export function sharePercentages(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return values.map(() => 0);

  const exact = values.map((value) => (value / total) * 100);
  const rounded = exact.map((value) => Math.floor(value));
  let remaining = 100 - rounded.reduce((sum, value) => sum + value, 0);

  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);

  for (const entry of byRemainder) {
    if (remaining <= 0) break;
    rounded[entry.index] += 1;
    remaining -= 1;
  }

  return rounded;
}

/** Build the analytics payload. */
export function getAnalyticsData(): AnalyticsData {
  const last24HourTotal = last24HourRows.reduce(
    (sum, row) => sum + row.value,
    0,
  );

  const stats: AnalyticsStat[] = [
    {
      id: "evaluations",
      label: "Evaluations · 24h",
      value: last24HourTotal,
      valueFormat: "compact",
      positiveIsGood: true,
      meta: { kind: "delta", percent: 12.4, label: "vs last week" },
    },
    {
      id: "throughput",
      label: "Peak Throughput",
      value: 6_420,
      valueFormat: "rate",
      positiveIsGood: true,
      meta: { kind: "note", text: "18:40 UTC", tone: "muted" },
    },
    {
      id: "users",
      label: "Unique Users",
      value: 128_940,
      valueFormat: "integer",
      positiveIsGood: true,
      meta: { kind: "delta", percent: 8.1, label: "vs last week" },
    },
    {
      id: "error-rate",
      label: "Error Rate",
      value: 0.02,
      valueFormat: "percent",
      fractionDigits: 2,
      positiveIsGood: false,
      meta: { kind: "note", text: "within SLO", tone: "ok" },
    },
  ];

  return {
    stats,
    series: {
      series,
      unit: "M",
      points: pointSeeds.map((point) => ({
        label: point.label,
        values: point.values,
        total: series.reduce(
          (sum, entry) => sum + (point.values[entry.envKey] ?? 0),
          0,
        ),
      })),
    },
    latency,
    last24Hours: { total: last24HourTotal, rows: last24HourRows },
    topFlags,
  };
}
