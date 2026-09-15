/**
 * TEMPORARY DASHBOARD MOCK DATA — not connected to anything.
 *
 * `apps/api` does not exist yet, so the Overview and Feature Flags screens read
 * from the fixtures below. Nothing here persists, nothing is fetched, and no
 * request is made. When the API lands, replace `getDashboardData` with calls to
 * `@/lib/api` and delete this module — the screens consume one object, so this
 * is the single swap point.
 *
 * Timestamps are stored as fixed "age" offsets rather than absolute dates and
 * are resolved against a `now` the caller passes in. That keeps relative labels
 * ("2h ago") stable between the server render and client hydration, and stops
 * the fixtures from drifting stale.
 */

import { formatRelativeTime, hoursAgo } from "@/lib/format";

/** A flag as the Feature Flags table needs to render it. */
export interface DashboardFlag {
  /** Unique flag key, e.g. `checkout-v2`. Maps to `FeatureFlag.key`. */
  key: string;
  name: string;
  description: string;
  owner: string;
  status: "active" | "rollout" | "disabled";
  /** Environment key this row is scoped to. */
  environment: string;
  /** Whole percentage, 0-100. Boolean flags sit at 0 or 100. */
  rolloutPercentage: number;
  /** Who last changed the flag. Maps to the audit log `actor`. */
  changeOwner: string;
  /** Short description of the last change. */
  changeNote: string;
  /** Age in hours, resolved against `now` — see module header. */
  updatedHoursAgo: number;
}

export interface ActiveRollout {
  key: string;
  environment: string;
  percentage: number;
}

export interface FlagHealth {
  environment: string;
  percentage: number;
  /** Change over the last 7 days, in percentage points. */
  delta: number;
  changedFlags: number;
  totalFlags: number;
}

export type ActivityKind = "toggle" | "rollout" | "segment" | "comment" | "key";

/** An activity entry as stored in the fixtures, before its label is derived. */
export interface RecentActivitySeed {
  id: string;
  kind: ActivityKind;
  title: string;
  description: string;
  /** Whole hours since the change. */
  ageHours: number;
  /** Whole days since the change; added to `ageHours` when resolving. */
  ageDays: number;
  actor: string | null;
}

/** An activity entry as rendered, with its relative label resolved. */
export interface RecentActivity extends Omit<RecentActivitySeed, "ageHours" | "ageDays"> {
  ageLabel: string;
}

export interface EvaluateSummary {
  totalRequests: number;
  windowHours: number;
  p95Ms: number;
  p99Ms: number;
  bars: number[];
}

export interface HeroStat {
  id: string;
  label: string;
  value: number;
  /** Change over the last 7 days. */
  delta: number;
  /** Whether a rising number is good. A rise in "Stale" is not. */
  positiveIsGood: boolean;
  footnote?: string;
}

export interface DashboardData {
  stats: HeroStat[];
  activeRollouts: ActiveRollout[];
  flagHealth: FlagHealth[];
  recentActivity: RecentActivity[];
  evaluateSummary: EvaluateSummary;
  flags: DashboardFlag[];
  environmentLabel: string;
  currentUser: CurrentUser;
}

export interface CurrentUser {
  name: string;
  email: string;
  initials: string;
  role: string;
}

const currentUser: CurrentUser = {
  name: "Yusuf Adebayo",
  email: "yusuf@dariise.dev",
  initials: "YA",
  role: "Owner",
};

const environmentLabel = "Production";

const flags: DashboardFlag[] = [
  {
    key: "checkout-v2",
    name: "Checkout v2",
    description: "New checkout experience",
    owner: "Platform",
    status: "active",
    environment: "production",
    rolloutPercentage: 100,
    changeOwner: "Zainab",
    changeNote: "Enabled for all traffic",
    updatedHoursAgo: 2,
  },
  {
    key: "new-dashboard",
    name: "New dashboard",
    description: "Redesigned app dashboard",
    owner: "Frontend",
    status: "active",
    environment: "production",
    rolloutPercentage: 100,
    changeOwner: "Daniel",
    changeNote: "Full release",
    updatedHoursAgo: 5,
  },
  {
    key: "dark-mode",
    name: "Dark mode",
    description: "Theme toggle for the app",
    owner: "Design Systems",
    status: "rollout",
    environment: "production",
    rolloutPercentage: 25,
    changeOwner: "Priya",
    changeNote: "Ramped to 25%",
    updatedHoursAgo: 9,
  },
  {
    key: "ai-summaries",
    name: "AI summaries",
    description: "Summarise activity with AI",
    owner: "Intelligence",
    status: "rollout",
    environment: "production",
    rolloutPercentage: 5,
    changeOwner: "Marcus",
    changeNote: "Rollout to internal staff",
    updatedHoursAgo: 12,
  },
  {
    key: "checkout-v3",
    name: "Checkout v3",
    description: "One-page checkout",
    owner: "Platform",
    status: "disabled",
    environment: "production",
    rolloutPercentage: 0,
    changeOwner: "Marcus",
    changeNote: "Killed after latency spike",
    updatedHoursAgo: 24,
  },
  {
    key: "beta-onboarding",
    name: "Onboarding",
    description: "Early access programme",
    owner: "Growth",
    status: "active",
    environment: "production",
    rolloutPercentage: 100,
    changeOwner: "Sarah",
    changeNote: "Opened to waitlist",
    updatedHoursAgo: 36,
  },
  {
    key: "search-ranking",
    name: "Search ranking",
    description: "Relevance tuning",
    owner: "Search",
    status: "rollout",
    environment: "production",
    rolloutPercentage: 50,
    changeOwner: "Liam",
    changeNote: "Comparisons enabled",
    updatedHoursAgo: 52,
  },
  {
    key: "sso-saml",
    name: "SSO / SAML",
    description: "Enterprise single sign-on",
    owner: "Identity",
    status: "active",
    environment: "production",
    rolloutPercentage: 100,
    changeOwner: "Tunde",
    changeNote: "Enabled for enterprise tier",
    updatedHoursAgo: 74,
  },
  {
    key: "flag-archiver",
    name: "Auto-Archive",
    description: "Suggest stale flags",
    owner: "Platform",
    status: "disabled",
    environment: "production",
    rolloutPercentage: 0,
    changeOwner: "Sarah",
    changeNote: "Paused pending review",
    updatedHoursAgo: 120,
  },
];

/** Flag health per environment, as shown on the Overview screen. */
const flagHealthSeed: FlagHealth[] = [
  {
    environment: "Production",
    percentage: 50,
    delta: 1,
    changedFlags: 21,
    totalFlags: 42,
  },
  {
    environment: "Staging",
    percentage: 26,
    delta: -3,
    changedFlags: 6,
    totalFlags: 24,
  },
  {
    environment: "Development",
    percentage: 10,
    delta: 7,
    changedFlags: 2,
    totalFlags: 24,
  },
];

const recentActivity: RecentActivitySeed[] = [
  {
    id: "act_1",
    kind: "toggle",
    title: "checkout-v2",
    description: "Enabled for all traffic",
    ageHours: 2,
    ageDays: 0,
    actor: "Zainab",
  },
  {
    id: "act_2",
    kind: "rollout",
    title: "new-dashboard",
    description: "Rollout increased from 25% to 50%",
    ageHours: 6,
    ageDays: 0,
    actor: "Daniel",
  },
  {
    id: "act_3",
    kind: "toggle",
    title: "dark-mode",
    description: "Killed by Daniel",
    ageHours: 18,
    ageDays: 0,
    actor: "Daniel",
  },
  {
    id: "act_4",
    kind: "segment",
    title: "beta-users",
    description: "Segment rules updated",
    ageHours: 0,
    ageDays: 1,
    actor: "Priya",
  },
  {
    id: "act_5",
    kind: "key",
    title: "prod-server-key",
    description: "Production SDK key rotated",
    ageHours: 0,
    ageDays: 2,
    actor: "Tunde",
  },
];

const evaluateSummary: EvaluateSummary = {
  totalRequests: 182_000,
  windowHours: 24,
  p95Ms: 4,
  p99Ms: 11,
  bars: [38, 52, 44, 61, 57, 72, 66, 81, 74, 88, 79, 93],
};

const heroStats: HeroStat[] = [
  {
    id: "total",
    label: "Total Flags",
    value: 42,
    delta: 3,
    positiveIsGood: true,
    footnote: "12 need attention",
  },
  {
    id: "evaluated",
    label: "Evaluated",
    value: 31,
    delta: 5,
    positiveIsGood: true,
  },
  {
    id: "scheduled",
    label: "Scheduled",
    value: 8,
    delta: 0,
    positiveIsGood: true,
  },
  { id: "stale", label: "Stale", value: 3, delta: 0, positiveIsGood: false },
];

/**
 * Look up a flag's summary row by key.
 *
 * The flag list is the canonical set of keys: a key that is not listed here
 * does not exist, which is what the detail route uses to decide between the
 * derived record and a 404.
 */
export function getFlagSummary(key: string): DashboardFlag | null {
  return flags.find((flag) => flag.key === key) ?? null;
}

/**
 * Build the dashboard payload.
 *
 * @param now - The moment relative labels are measured against. Callers pass a
 * single value for the whole render so server and client agree.
 */
export function getDashboardData(now: Date): DashboardData {
  return {
    stats: heroStats,
    activeRollouts: flags
      .filter((flag) => flag.status === "rollout")
      .map((flag) => ({
        key: flag.key,
        environment: flag.environment,
        percentage: flag.rolloutPercentage,
      })),
    flagHealth: flagHealthSeed,
    recentActivity: recentActivity.map((entry) => ({
      ...entry,
      ageLabel: formatRelativeTime(
        hoursAgo(entry.ageHours + entry.ageDays * 24, now),
        now,
      ),
    })),
    evaluateSummary,
    flags,
    environmentLabel,
    currentUser,
  };
}
