/**
 * TEMPORARY FLAG DETAIL MOCK DATA — not connected to anything.
 *
 * `dashboard-data.ts` remains the source of the table's summary rows; this
 * module owns the richer per-flag records that the detail screens need, so that
 * file does not double in size. Together they are the swap point for
 * `@/lib/api` once `apps/api` exists.
 *
 * Only `checkout-v2` is transcribed in full from the design. Every other flag
 * gets a record derived from its summary row (a single always-on rule, no
 * history, no dependencies) so that no row in the flags table leads to a page
 * that renders nothing.
 *
 * Timestamps are stored as fixed "age" offsets and resolved against a `now` the
 * caller passes in, so relative labels stay stable between the server render
 * and client hydration.
 */

import { formatRelativeTime, hoursAgo } from "@/lib/format";

export type FlagType = "boolean" | "string" | "number" | "json";

export interface FlagVariation {
  name: string;
  value: string;
  description: string;
}

export type TargetingOperator =
  | "is one of"
  | "is not one of"
  | "equals"
  | "contains"
  | "matches";

export interface TargetingCondition {
  /** Stable id, used as the React key. */
  id: string;
  attribute: string;
  operator: TargetingOperator;
  values: string[];
}

export interface TargetingRule {
  id: string;
  /** Human label, e.g. `Rule 1`. */
  name: string;
  conditions: TargetingCondition[];
  /** Variation served when every condition matches. */
  serve: string;
  /** Optional partial rollout within the rule. Absent means all matching users. */
  rollout?: number;
}

export interface IndividualTarget {
  userId: string;
  serve: string;
}

export interface FlagVersion {
  /** Monospace version label, e.g. `v12`. */
  version: string;
  description: string;
  author: string;
  ageHours: number;
  ageDays: number;
  /** The variation in force at this version, shown on the right of the row. */
  serve: string;
  current?: boolean;
}

export interface FlagDependency {
  key: string;
  /** Variation the parent flag must serve for this dependency to be satisfied. */
  requires: string;
  /** Version of the dependent flag that introduced the reference. */
  referencedIn: string;
  ageHours: number;
  ageDays: number;
}

export interface DependencySummary {
  upstream: number;
  downstream: number;
  circular: number;
  maxDepth: number;
}

export interface EvaluationOrderEntry {
  key: string;
  status: string;
  /** Marks the entry for the flag currently being viewed. */
  isSelf?: boolean;
}

export interface DependencyRecord {
  upstream: FlagDependency[];
  downstream: FlagDependency[];
  summary: DependencySummary;
  evaluationOrder: EvaluationOrderEntry[];
}

export interface FlagDetail {
  key: string;
  name: string;
  description: string;
  owner: string;
  environment: string;
  type: FlagType;
  enabled: boolean;
  /** Variation served when no rule matches and the flag is off. */
  offVariation: string;
  /** Variation served when the flag is on but no rule matches. */
  defaultVariation: string;
  variations: FlagVariation[];
  rules: TargetingRule[];
  individualTargets: IndividualTarget[];
  /** Whole percentage, 0-100. */
  rolloutPercentage: number;
  /** Attribute hashed to bucket users. */
  bucketBy: string;
  /** Variant of a related flag, shown in the evaluator fallback snippet. */
  fallbackVariant: string;
  versions: FlagVersion[];
  dependencies: DependencyRecord;
  createdHoursAgo: number;
  updatedHoursAgo: number;
}

/** A dependency with its relative label resolved. */
export type ResolvedDependency = Omit<FlagDependency, "ageHours" | "ageDays"> & {
  ageLabel: string;
};

/** A version with its relative label resolved. */
export type ResolvedVersion = Omit<FlagVersion, "ageHours" | "ageDays"> & {
  ageLabel: string;
};

/**
 * A flag detail record shaped for rendering: the same data as `FlagDetail`,
 * with age offsets replaced by display labels.
 */
export interface FlagDetailView extends Omit<FlagDetail, "versions" | "dependencies"> {
  versions: ResolvedVersion[];
  dependencies: Omit<DependencyRecord, "upstream" | "downstream"> & {
    upstream: ResolvedDependency[];
    downstream: ResolvedDependency[];
  };
  createdLabel: string;
  updatedLabel: string;
}

const checkoutV2: FlagDetail = {
  key: "checkout-v2",
  name: "New checkout experience",
  description: "The new checkout experience with express pay and saved cards.",
  owner: "Platform",
  environment: "production",
  type: "boolean",
  enabled: true,
  offVariation: "False",
  defaultVariation: "False",
  variations: [
    {
      name: "True",
      value: "true",
      description: "The new checkout experience with express pay and saved cards.",
    },
    {
      name: "False",
      value: "false",
      description: "The current checkout experience.",
    },
  ],
  rules: [
    {
      id: "rule-1",
      name: "Rule 1",
      conditions: [
        {
          id: "cond-1",
          attribute: "user.plan",
          operator: "is one of",
          values: ["Enterprise"],
        },
        {
          id: "cond-2",
          attribute: "user.country",
          operator: "equals",
          values: ["NG"],
        },
      ],
      serve: "On",
    },
    {
      id: "rule-2",
      name: "Rule 2",
      conditions: [
        {
          id: "cond-3",
          attribute: "user.email",
          operator: "matches",
          values: ["@acme.io"],
        },
      ],
      serve: "On",
      rollout: 10,
    },
  ],
  individualTargets: [
    { userId: "user_4821", serve: "On" },
    { userId: "user_9930", serve: "Off" },
  ],
  rolloutPercentage: 50,
  bucketBy: "user_id",
  fallbackVariant: "False",
  versions: [
    {
      version: "v12",
      description: "Enabled checkout-v2 in Production",
      author: "You",
      ageHours: 2,
      ageDays: 0,
      serve: "Off",
      current: true,
    },
    {
      version: "v11",
      description: "Added jira team emails with @acme.io",
      author: "You",
      ageHours: 5,
      ageDays: 0,
      serve: "Off",
    },
    {
      version: "v10",
      description: "Rollout changed 25% → 50% in Production",
      author: "Sarah Chen",
      ageHours: 8,
      ageDays: 0,
      serve: "25% rollout",
    },
    {
      version: "v9",
      description: "Added percentage rollout of 25%",
      author: "Sarah Chen",
      ageHours: 13,
      ageDays: 0,
      serve: "25% rollout",
    },
    {
      version: "v8",
      description: "Enabled in Staging",
      author: "Marcus Reid",
      ageHours: 0,
      ageDays: 1,
      serve: "On",
    },
    {
      version: "v7",
      description: "Created checkout-v2 with variations On / Off",
      author: "You",
      ageHours: 0,
      ageDays: 2,
      serve: "Off",
    },
  ],
  dependencies: {
    upstream: [
      {
        key: "payments-v2",
        requires: "Enabled · all env",
        referencedIn: "v10",
        ageHours: 13,
        ageDays: 0,
      },
      {
        key: "auth-session",
        requires: "Enabled · all env",
        referencedIn: "v10",
        ageHours: 13,
        ageDays: 0,
      },
    ],
    downstream: [
      {
        key: "checkout-v3-preview",
        requires: "50% rollout · Production",
        referencedIn: "v 3",
        ageHours: 0,
        ageDays: 7,
      },
    ],
    summary: { upstream: 2, downstream: 1, circular: 0, maxDepth: 3 },
    evaluationOrder: [
      { key: "payments-v2", status: "Enabled" },
      { key: "auth-session", status: "Enabled" },
      { key: "checkout-v2", status: "This flag", isSelf: true },
      { key: "checkout-v3-preview", status: "Enabled" },
    ],
  },
  createdHoursAgo: 0,
  updatedHoursAgo: 2,
};

/** Cache of authored records. Flags absent here get a derived record below. */
const authored: Record<string, FlagDetail> = {
  [checkoutV2.key]: checkoutV2,
};

/** Summary fields the derived records need from `dashboard-data.ts`. */
export interface DerivedFlagInput {
  key: string;
  name: string;
  description: string;
  owner: string;
  environment: string;
  rolloutPercentage: number;
  updatedHoursAgo: number;
}

/**
 * Build a complete record for a flag that has no authored detail.
 *
 * The result is intentionally plain: one always-on rule, a single True/False
 * pair and no history, so the screens render meaningfully without pretending to
 * have data that was never designed.
 */
function deriveFlag(input: DerivedFlagInput): FlagDetail {
  return {
    key: input.key,
    name: input.name,
    description: input.description,
    owner: input.owner,
    environment: input.environment,
    type: "boolean",
    enabled: input.rolloutPercentage > 0,
    offVariation: "False",
    defaultVariation: "False",
    variations: [
      { name: "True", value: "true", description: `${input.name} is enabled.` },
      { name: "False", value: "false", description: `${input.name} is disabled.` },
    ],
    rules: [],
    individualTargets: [],
    rolloutPercentage: input.rolloutPercentage,
    bucketBy: "user_id",
    fallbackVariant: "False",
    versions: [],
    dependencies: {
      upstream: [],
      downstream: [],
      summary: { upstream: 0, downstream: 0, circular: 0, maxDepth: 0 },
      evaluationOrder: [
        { key: input.key, status: "This flag", isSelf: true },
      ],
    },
    createdHoursAgo: input.updatedHoursAgo + 24,
    updatedHoursAgo: input.updatedHoursAgo,
  };
}

function resolveVersion(version: FlagVersion, now: Date): ResolvedVersion {
  const { ageHours, ageDays, ...rest } = version;
  return {
    ...rest,
    ageLabel: formatRelativeTime(hoursAgo(ageHours + ageDays * 24, now), now),
  };
}

function resolveDependency(
  dependency: FlagDependency,
  now: Date,
): ResolvedDependency {
  const { ageHours, ageDays, ...rest } = dependency;
  return {
    ...rest,
    ageLabel: formatRelativeTime(hoursAgo(ageHours + ageDays * 24, now), now),
  };
}

/**
 * Look up a flag's detail record.
 *
 * @param key - Flag key from the route.
 * @param now - The moment relative labels are measured against.
 * @param fallback - Summary row used to derive a record when `key` has no
 * authored detail. Pass the row from `getDashboardData().flags` when available.
 * @returns The resolved record, or `null` when the key is unknown.
 */
export function getFlagDetail(
  key: string,
  now: Date,
  fallback?: DerivedFlagInput,
): FlagDetailView | null {
  const record = authored[key] ?? (fallback ? deriveFlag(fallback) : null);
  if (!record) return null;

  return {
    ...record,
    versions: record.versions.map((version) => resolveVersion(version, now)),
    dependencies: {
      ...record.dependencies,
      upstream: record.dependencies.upstream.map((dependency) =>
        resolveDependency(dependency, now),
      ),
      downstream: record.dependencies.downstream.map((dependency) =>
        resolveDependency(dependency, now),
      ),
    },
    createdLabel: formatRelativeTime(
      hoursAgo(record.createdHoursAgo, now),
      now,
    ),
    updatedLabel: formatRelativeTime(
      hoursAgo(record.updatedHoursAgo, now),
      now,
    ),
  };
}
