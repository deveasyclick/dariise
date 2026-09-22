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
  environment: string;
  /** Whole percentage, 0-100. Boolean flags sit at 0 or 100. */
  rolloutPercentage: number;
  /** Who last changed the flag. Maps to the audit log `actor`. */
  changeOwner: string;
  changeNote: string;
  /** Age in hours, resolved against `now` — see module header. */
  updatedHoursAgo: number;
}

export interface ActiveRollout {
  flagKey: string;
  environment: string;
  percentage: number;
}

/** A flag's on/off split in one environment, as the health panel shows it. */
export interface FlagHealth {
  environment: string;
  enabled: number;
  disabled: number;
}

export type ActivityKind =
  | "enabled"
  | "rollout"
  | "created"
  | "segment"
  | "key";

/** An activity entry as stored in the fixtures, before its label is derived. */
export interface RecentActivitySeed {
  id: string;
  kind: ActivityKind;
  title: string;
  description: string;
  /** Whole minutes since the change, on top of `ageHours` and `ageDays`. */
  ageMinutes?: number;
  /** Whole hours since the change. */
  ageHours: number;
  /** Whole days since the change; added to `ageHours` when resolving. */
  ageDays?: number;
  actor: string | null;
}

/** An activity entry as rendered, with its relative label resolved. */
export interface RecentActivity
  extends Omit<RecentActivitySeed, "ageMinutes" | "ageHours" | "ageDays"> {
  ageLabel: string;
}

export interface EvaluateSummary {
  /** Evaluations per minute over the window the card quotes. */
  perMinute: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export type HeroStatId = "total" | "enabled" | "scheduled" | "stale";

export interface HeroStat {
  id: HeroStatId;
  label: string;
  value: number;
  /** Note shown beside the icon, e.g. `+3 this week` or `next: Sep 28`. */
  note: string;
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
  // The workspace is `Acme Inc`, whose allowed email domain is `acme.io` — see
  // `settings-data.ts` — so the signed-in user belongs to it.
  email: "yusuf@acme.io",
  initials: "YA",
  role: "Owner",
};

/**
 * The signed-in user.
 *
 * Exposed on its own because the chrome and the Profile screen need the identity
 * without the dashboard figures that `getDashboardData` resolves.
 */
export function getCurrentUser(): CurrentUser {
  return currentUser;
}

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

/**
 * Active rollouts, as the Overview panel lists them.
 *
 * Deliberately its own fixture rather than a projection of `flags`: the design's
 * rollout percentages (and the environments they sit in) are stated per rollout,
 * and a flag can be fully released in one environment while still ramping in
 * another.
 */
const activeRollouts: ActiveRollout[] = [
  { flagKey: "new-dashboard", environment: "Production", percentage: 50 },
  { flagKey: "search-ranking", environment: "Production", percentage: 25 },
  { flagKey: "ai-summaries", environment: "Staging", percentage: 10 },
];

/** Flag health per environment, as shown on the Overview screen. */
const flagHealthSeed: FlagHealth[] = [
  { environment: "Production", enabled: 31, disabled: 6 },
  { environment: "Staging", enabled: 17, disabled: 2 },
  { environment: "Development", enabled: 40, disabled: 0 },
];

const recentActivity: RecentActivitySeed[] = [
  {
    id: "act_1",
    kind: "enabled",
    title: "checkout-v2",
    description: "enabled in Production by Yusuf",
    ageHours: 0,
    ageMinutes: 2,
    actor: "Yusuf",
  },
  {
    id: "act_2",
    kind: "rollout",
    title: "new-dashboard",
    description: "rollout changed 25% → 50%",
    ageHours: 0,
    ageMinutes: 18,
    actor: "Daniel",
  },
  {
    id: "act_3",
    kind: "created",
    title: "dark-mode",
    description: "created by Sarah Chen",
    ageHours: 1,
    ageMinutes: 0,
    actor: "Sarah Chen",
  },
  {
    id: "act_4",
    kind: "segment",
    title: "beta-users",
    description: "segment rules updated",
    ageHours: 3,
    ageMinutes: 0,
    actor: "Priya",
  },
  {
    id: "act_5",
    kind: "key",
    title: "ff_prod_8a2c",
    description: "Production SDK key rotated",
    ageHours: 0,
    ageDays: 1,
    ageMinutes: 0,
    actor: "Tunde",
  },
];

const evaluateSummary: EvaluateSummary = {
  perMinute: 182_000,
  p50Ms: 4,
  p95Ms: 11,
  p99Ms: 24,
};

const heroStats: HeroStat[] = [
  {
    id: "total",
    label: "Total Flags",
    value: 42,
    note: "+3 this week",
  },
  {
    id: "enabled",
    label: "Enabled",
    value: 31,
    note: "+5 vs last week",
  },
  {
    id: "scheduled",
    label: "Scheduled",
    value: 8,
    note: "next: Sep 28",
  },
  { id: "stale", label: "Stale", value: 3, note: "no eval. in 30d" },
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
    activeRollouts,
    flagHealth: flagHealthSeed,
    recentActivity: recentActivity.map((entry) => ({
      ...entry,
      ageLabel: formatRelativeTime(
        hoursAgo(
          (entry.ageDays ?? 0) * 24 +
            entry.ageHours +
            (entry.ageMinutes ?? 0) / 60,
          now,
        ),
        now,
      ),
    })),
    evaluateSummary,
    flags,
    environmentLabel,
    currentUser,
  };
}
