/**
 * TEMPORARY ENVIRONMENT MOCK DATA — not connected to anything.
 *
 * `apps/api` does not exist yet, so the environment screens read from the
 * fixtures below, in the same spirit as `dashboard-data.ts` and
 * `flag-detail-data.ts`. Nothing here is fetched or persisted. When the API
 * lands, replace the getters with calls to `@/lib/api` and delete this module —
 * every screen consumes one of four functions, so this is the swap point.
 *
 * Two fixtures are transcribed from the design: the three environments and the
 * flag coverage matrix. Endpoints and masked keys are derived from them rather
 * than stored twice, so a URL can never drift from the environment it belongs
 * to.
 *
 * Age offsets are stored rather than absolute dates and resolved against a
 * `now` the caller passes in, so relative and absolute labels stay stable
 * between the server render and client hydration.
 */

import { formatDate, formatRelativeTime, hoursAgo } from "@/lib/format";

export type EnvironmentColor =
  | "primary"
  | "cyan"
  | "purple"
  | "green"
  | "indigo"
  | "slate";

export type EnvironmentStatus = "healthy" | "degraded";

/** How a new environment's flags start out. See the create screen. */
export type InitialFlagStatus = "all-off" | "copy-source" | "all-on";

export type SdkKeyKind = "server" | "client" | "mobile";

/** Flag totals per environment, as shown on the cards and Environment health. */
export interface EnvironmentCounts {
  on: number;
  off: number;
  scheduled: number;
}

export interface SdkKey {
  kind: SdkKeyKind;
  /** Human label, e.g. `Server key`. */
  label: string;
  /**
   * The full fixture credential. Masked before it reaches a screen — see
   * `maskSdkKey` — so the only place a complete key exists is here.
   */
  value: string;
  createdDaysAgo: number;
}

export interface EnvironmentEndpoint {
  label: string;
  description: string;
  url: string;
}

export interface EnvironmentSettings {
  protectedEnvironment: boolean;
  requireApprovals: boolean;
  singleUseSdkKeys: boolean;
}

export interface EnvironmentRecord {
  /** Unique key, e.g. `production`. Maps to `Environment.key`. */
  key: string;
  name: string;
  color: EnvironmentColor;
  status: EnvironmentStatus;
  /** The environment new flags are created in and the design marks DEFAULT. */
  isDefault: boolean;
  /** Masked server key shown on the list card, transcribed from the design. */
  maskedKey: string;
  /** Host serving evaluation and streaming for every environment. */
  sdkHost: string;
  /** Host receiving exposure and metric events. */
  eventsHost: string;
  /** URL segment that identifies this environment, e.g. `prod`. */
  pathSegment: string;
  counts: EnvironmentCounts;
  /** p50 evaluation latency in milliseconds, in the design's unit. */
  evalLatencyP50Ms: number;
  sdkKeys: SdkKey[];
  settings: EnvironmentSettings;
  createdDaysAgo: number;
}

/** An SDK key with its credential masked and its creation date resolved. */
export interface ResolvedSdkKey extends Omit<SdkKey, "createdDaysAgo"> {
  createdLabel: string;
  masked: string;
}

/** An environment shaped for rendering: offsets replaced by display labels. */
export interface EnvironmentView extends Omit<EnvironmentRecord, "sdkKeys"> {
  baseUrl: string;
  evalUrl: string;
  streamUrl: string;
  eventsUrl: string;
  createdLabel: string;
  endpoints: EnvironmentEndpoint[];
  sdkKeys: ResolvedSdkKey[];
}

/** Serialisable subset the create form needs to render its environment select. */
export interface EnvironmentOption {
  key: string;
  name: string;
  color: EnvironmentColor;
  /** The form preselects this one as the copy source. */
  isDefault: boolean;
}

export interface FlagCoverageState {
  kind: "on" | "off" | "percentage";
  /** Whole percentage, only set when `kind` is `percentage`. */
  percentage?: number;
}

export interface FlagCoverageRow {
  /** Flag key, e.g. `checkout-v2`. */
  key: string;
  /** Effective state per environment key. A missing entry reads as `off`. */
  states: Record<string, FlagCoverageState>;
  changedMinutesAgo: number;
}

export interface ResolvedCoverageRow
  extends Omit<FlagCoverageRow, "changedMinutesAgo"> {
  changedLabel: string;
}

/** Coverage data without the timestamp, for Client Components. */
export interface CoverageFlag {
  key: string;
  states: Record<string, FlagCoverageState>;
}

const ON: FlagCoverageState = { kind: "on" };
const OFF: FlagCoverageState = { kind: "off" };

function percentage(value: number): FlagCoverageState {
  return { kind: "percentage", percentage: value };
}

const environments: EnvironmentRecord[] = [
  {
    key: "development",
    name: "Development",
    color: "cyan",
    status: "healthy",
    isDefault: false,
    maskedKey: "ff_dev_••••••••",
    sdkHost: "sdk.dariise.dev",
    eventsHost: "events.dariise.dev",
    pathSegment: "dev",
    counts: { on: 40, off: 2, scheduled: 1 },
    evalLatencyP50Ms: 9,
    sdkKeys: [
      {
        kind: "server",
        label: "Server key",
        value: "ff_dev_9f2a1b3c4d5e",
        createdDaysAgo: 40,
      },
      {
        kind: "client",
        label: "Client key",
        value: "ff_pub_7c8d9e0f1a2b",
        createdDaysAgo: 40,
      },
      {
        kind: "mobile",
        label: "Mobile key",
        value: "ff_mob_5b6c7d8e9f0a",
        createdDaysAgo: 12,
      },
    ],
    settings: {
      protectedEnvironment: false,
      requireApprovals: false,
      singleUseSdkKeys: false,
    },
    createdDaysAgo: 96,
  },
  {
    key: "staging",
    name: "Staging",
    color: "purple",
    status: "healthy",
    isDefault: false,
    maskedKey: "ff_stg_••••••••",
    sdkHost: "sdk.dariise.dev",
    eventsHost: "events.dariise.dev",
    pathSegment: "stg",
    counts: { on: 37, off: 3, scheduled: 2 },
    evalLatencyP50Ms: 6,
    sdkKeys: [
      {
        kind: "server",
        label: "Server key",
        value: "ff_stg_3e4f5a6b7c8d",
        createdDaysAgo: 28,
      },
      {
        kind: "client",
        label: "Client key",
        value: "ff_pub_1a2b3c4d5e6f",
        createdDaysAgo: 28,
      },
      {
        kind: "mobile",
        label: "Mobile key",
        value: "ff_mob_9c8d7e6f5a4b",
        createdDaysAgo: 9,
      },
    ],
    settings: {
      protectedEnvironment: true,
      requireApprovals: false,
      singleUseSdkKeys: false,
    },
    createdDaysAgo: 72,
  },
  {
    key: "production",
    name: "Production",
    color: "primary",
    status: "healthy",
    isDefault: true,
    maskedKey: "ff_prod_••••••••",
    sdkHost: "sdk.dariise.dev",
    eventsHost: "events.dariise.dev",
    pathSegment: "prod",
    counts: { on: 31, off: 8, scheduled: 3 },
    evalLatencyP50Ms: 4,
    sdkKeys: [
      {
        kind: "server",
        label: "Server key",
        value: "ff_prod_a1b2c3d4e5f6",
        createdDaysAgo: 21,
      },
      {
        kind: "client",
        label: "Client key",
        value: "ff_pub_c3d4e5f6a7b8",
        createdDaysAgo: 21,
      },
      {
        kind: "mobile",
        label: "Mobile key",
        value: "ff_mob_e5f6a7b8c9d0",
        createdDaysAgo: 60,
      },
    ],
    settings: {
      protectedEnvironment: true,
      requireApprovals: true,
      singleUseSdkKeys: false,
    },
    createdDaysAgo: 180,
  },
];

/**
 * The flags the coverage matrix shows.
 *
 * A subset, not the whole catalogue: the design lists the flags whose effective
 * state is worth comparing across environments. `payments-v2` appears here only
 * as a dependency of `checkout-v2` elsewhere in the fixtures, which is why the
 * table renders keys as plain text rather than links.
 */
const coverage: FlagCoverageRow[] = [
  {
    key: "checkout-v2",
    states: { development: ON, staging: ON, production: OFF },
    changedMinutesAgo: 2,
  },
  {
    key: "dark-mode",
    states: { development: ON, staging: ON, production: ON },
    changedMinutesAgo: 60,
  },
  {
    key: "new-dashboard",
    states: {
      development: percentage(50),
      staging: percentage(50),
      production: percentage(25),
    },
    changedMinutesAgo: 18,
  },
  {
    key: "payments-v2",
    states: { development: OFF, staging: OFF, production: OFF },
    changedMinutesAgo: 24 * 60,
  },
  {
    key: "search-ranking",
    states: { development: ON, staging: percentage(50), production: OFF },
    changedMinutesAgo: 2 * 24 * 60,
  },
  {
    key: "ai-summaries",
    states: { development: ON, staging: ON, production: OFF },
    changedMinutesAgo: 5 * 24 * 60,
  },
];

/**
 * Mask a credential for display, keeping the prefix and four identifier
 * characters: `ff_prod_a1b2c3d4e5f6` becomes `ff_prod_a1b2••••••`.
 *
 * The prefix is everything up to the separator that follows the `ff` segment,
 * so `ff_dev_`, `ff_pub_` and `ff_mob_` all mask correctly.
 */
export function maskSdkKey(value: string): string {
  const separator = value.indexOf("_", 3);
  const prefixEnd = separator === -1 ? 0 : separator + 1;
  const revealedEnd = Math.min(value.length, prefixEnd + 4);

  return `${value.slice(0, revealedEnd)}••••••`;
}

function endpointsFor(record: EnvironmentRecord): EnvironmentEndpoint[] {
  const base = `${record.sdkHost}/${record.pathSegment}`;

  return [
    {
      label: "Evaluation",
      description: "Resolve flags at runtime",
      url: `${base}/eval`,
    },
    {
      label: "Streaming",
      description: "Live updates over SSE",
      url: `${base}/stream`,
    },
    {
      label: "Events",
      description: "Send exposure & metric events",
      url: `${record.eventsHost}/${record.pathSegment}`,
    },
  ];
}

function resolve(record: EnvironmentRecord, now: Date): EnvironmentView {
  return {
    ...record,
    baseUrl: `${record.sdkHost}/${record.pathSegment}`,
    evalUrl: `${record.sdkHost}/${record.pathSegment}/eval`,
    streamUrl: `${record.sdkHost}/${record.pathSegment}/stream`,
    eventsUrl: `${record.eventsHost}/${record.pathSegment}`,
    createdLabel: formatDate(hoursAgo(record.createdDaysAgo * 24, now)),
    endpoints: endpointsFor(record),
    sdkKeys: record.sdkKeys.map((sdkKey) => {
      const { createdDaysAgo, ...rest } = sdkKey;

      return {
        ...rest,
        masked: maskSdkKey(sdkKey.value),
        createdLabel: formatDate(hoursAgo(createdDaysAgo * 24, now)),
      };
    }),
  };
}

/**
 * Every environment, in design order.
 *
 * @param now - The moment absolute dates are measured against.
 */
export function getEnvironments(now: Date): EnvironmentView[] {
  return environments.map((record) => resolve(record, now));
}

/**
 * Look up one environment by key.
 *
 * The fixture list is the canonical set of keys: a key that is not listed here
 * does not exist, which is what the detail routes use to decide between the
 * resolved record and a 404.
 */
export function getEnvironment(key: string, now: Date): EnvironmentView | null {
  const record = environments.find((item) => item.key === key);
  return record ? resolve(record, now) : null;
}

/** Serialisable options for the create form's environment select. */
export function getEnvironmentOptions(): EnvironmentOption[] {
  return environments.map((record) => ({
    key: record.key,
    name: record.name,
    color: record.color,
    isDefault: record.isDefault,
  }));
}

/** Coverage rows with their change times resolved. */
export function getFlagCoverage(now: Date): ResolvedCoverageRow[] {
  return coverage.map((row) => {
    const { changedMinutesAgo, ...rest } = row;

    return {
      ...rest,
      changedLabel: formatRelativeTime(
        hoursAgo(changedMinutesAgo / 60, now),
        now,
      ),
    };
  });
}

/** Coverage rows without timestamps, for Client Components. */
export function getCoverageFlags(): CoverageFlag[] {
  return coverage.map((row) => ({ key: row.key, states: row.states }));
}
