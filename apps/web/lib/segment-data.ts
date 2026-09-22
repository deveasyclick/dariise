/**
 * TEMPORARY SEGMENT MOCK DATA — not connected to anything.
 *
 * `lib/types.ts` describes the API's own `Segment` shape; this module is the
 * fixture layer the segment screens render from, in the same spirit as
 * `dashboard-data.ts` and `flag-detail-data.ts`. When the API lands, replace
 * `getSegments` / `getSegment` with calls to `@/lib/api` and delete this file.
 *
 * Members are derived, never invented: `matchesSegment` evaluates a rule set
 * against a curated sample pool, and every member count and preview row in the
 * UI goes through it. That keeps the list, the Summary card and the live
 * preview consistent with each other by construction.
 *
 * Age offsets are stored rather than absolute dates and resolved against a
 * caller-supplied `now`, so relative labels stay stable between the server
 * render and client hydration.
 */

import { formatRelativeTime, hoursAgo } from "@/lib/format";

export type SegmentOperator =
  | "is"
  | "is not"
  | "is one of"
  | "ends with"
  | "starts with"
  | "greater than"
  | "less than";

export interface SegmentRule {
  /** Stable id, used as the React key. */
  id: string;
  attribute: string;
  operator: SegmentOperator;
  values: string[];
}

export interface SegmentFlagRef {
  key: string;
  environment: string;
  /** `Enabled` or a rollout label such as `50%`. */
  status: string;
  /** A rollout below 100% is shown with a warning tone. */
  isRollout: boolean;
}

export interface Segment {
  key: string;
  name: string;
  description: string;
  rules: SegmentRule[];
  flags: SegmentFlagRef[];
  updatedHoursAgo: number;
  owner: string;
}

/** Every attribute a rule can address. */
export interface SampleUser {
  id: string;
  beta: boolean;
  email: string;
  plan: "Free" | "Pro" | "Enterprise";
  region: "EU" | "US" | "NG" | "APAC";
  sessions: number;
}

export interface SegmentView extends Omit<Segment, "updatedHoursAgo"> {
  updatedLabel: string;
  memberCount: number;
  /** The members that satisfy the rules, capped for display. */
  members: SampleUser[];
}

export interface SegmentSummary extends SegmentView {
  /** Compact one-line rule description for the list table. */
  ruleSummary: string;
}

/**
 * A small, fixed audience.
 *
 * Deliberately curated rather than generated: a deterministic pool means the
 * derived counts are stable across renders and are meaningful when read. It is
 * a sample, not a customer list.
 */
export const sampleUsers: SampleUser[] = [
  { id: "u_4821", beta: true, email: "ada@acme.io", plan: "Pro", region: "EU", sessions: 42 },
  { id: "u_9930", beta: true, email: "grace@acme.io", plan: "Pro", region: "EU", sessions: 31 },
  { id: "u_2210", beta: true, email: "alan@little.dev", plan: "Pro", region: "US", sessions: 28 },
  { id: "u_1042", beta: true, email: "katherine@acme.io", plan: "Enterprise", region: "US", sessions: 57 },
  { id: "u_7731", beta: true, email: "linus@kernel.org", plan: "Enterprise", region: "EU", sessions: 63 },
  { id: "u_3390", beta: true, email: "margaret@acme.io", plan: "Enterprise", region: "US", sessions: 71 },
  { id: "u_5512", beta: true, email: "barbara@acme.io", plan: "Pro", region: "EU", sessions: 19 },
  { id: "u_8804", beta: true, email: "donald@acme.io", plan: "Pro", region: "US", sessions: 22 },
  { id: "u_6613", beta: true, email: "tim@acme.io", plan: "Pro", region: "APAC", sessions: 15 },
  { id: "u_4457", beta: true, email: "vint@acme.io", plan: "Enterprise", region: "US", sessions: 48 },
  { id: "u_9981", beta: true, email: "radia@acme.io", plan: "Pro", region: "US", sessions: 33 },
  { id: "u_2277", beta: true, email: "leslie@acme.io", plan: "Enterprise", region: "EU", sessions: 51 },
  { id: "u_7408", beta: true, email: "shafi@acme.io", plan: "Pro", region: "APAC", sessions: 26 },
  { id: "u_1120", beta: true, email: "guido@acme.io", plan: "Enterprise", region: "EU", sessions: 60 },
  { id: "u_3366", beta: true, email: "james@acme.io", plan: "Free", region: "NG", sessions: 12 },
  { id: "u_5590", beta: true, email: "anita@acme.io", plan: "Pro", region: "US", sessions: 37 },
  { id: "u_8812", beta: true, email: "jean@acme.io", plan: "Pro", region: "EU", sessions: 24 },
  { id: "u_2035", beta: true, email: "frances@acme.io", plan: "Enterprise", region: "US", sessions: 66 },
  { id: "u_6644", beta: true, email: "ken@acme.io", plan: "Free", region: "NG", sessions: 8 },
  { id: "u_9173", beta: true, email: "bjarne@acme.io", plan: "Enterprise", region: "EU", sessions: 44 },
  { id: "u_3081", beta: true, email: "sophie@acme.io", plan: "Pro", region: "US", sessions: 29 },
  { id: "u_7726", beta: false, email: "dennis@acme.io", plan: "Free", region: "US", sessions: 5 },
  { id: "u_4419", beta: false, email: "brian@acme.io", plan: "Free", region: "EU", sessions: 3 },
  { id: "u_1928", beta: false, email: "barbara2@acme.io", plan: "Free", region: "EU", sessions: 41 },
  { id: "u_5050", beta: false, email: "alex@acme.io", plan: "Free", region: "US", sessions: 2 },
  { id: "u_6155", beta: false, email: "ron@acme.io", plan: "Free", region: "NG", sessions: 9 },
  { id: "u_8307", beta: false, email: "thompson@acme.io", plan: "Free", region: "NG", sessions: 14 },
  { id: "u_3721", beta: false, email: "andrew@acme.io", plan: "Pro", region: "EU", sessions: 27 },
  { id: "u_9482", beta: false, email: "leslie2@acme.io", plan: "Pro", region: "EU", sessions: 45 },
  { id: "u_5638", beta: false, email: "yukihiro@acme.io", plan: "Pro", region: "APAC", sessions: 38 },
  { id: "u_4015", beta: false, email: "brendan@acme.io", plan: "Pro", region: "US", sessions: 52 },
  { id: "u_7340", beta: false, email: "rasmus@acme.io", plan: "Pro", region: "EU", sessions: 17 },
  { id: "u_1902", beta: false, email: "anders@acme.io", plan: "Pro", region: "EU", sessions: 34 },
  { id: "u_6284", beta: false, email: "bjarne2@acme.io", plan: "Enterprise", region: "US", sessions: 58 },
  { id: "u_2468", beta: false, email: "margaret2@acme.io", plan: "Enterprise", region: "APAC", sessions: 62 },
  { id: "u_5913", beta: false, email: "edward@acme.io", plan: "Enterprise", region: "US", sessions: 49 },
  { id: "u_7026", beta: false, email: "ida@acme.io", plan: "Enterprise", region: "EU", sessions: 55 },
  { id: "u_8170", beta: false, email: "shafi2@acme.io", plan: "Pro", region: "APAC", sessions: 21 },
  { id: "u_2350", beta: false, email: "radia2@acme.io", plan: "Pro", region: "US", sessions: 30 },
  { id: "u_3579", beta: false, email: "vint2@acme.io", plan: "Enterprise", region: "US", sessions: 40 },
  { id: "u_6231", beta: false, email: "tim2@acme.io", plan: "Pro", region: "APAC", sessions: 16 },
  { id: "u_8094", beta: false, email: "michael@acme.io", plan: "Pro", region: "EU", sessions: 25 },
  { id: "u_4318", beta: false, email: "james2@acme.io", plan: "Free", region: "NG", sessions: 7 },
  { id: "u_9506", beta: false, email: "anita2@acme.io", plan: "Pro", region: "US", sessions: 36 },
  { id: "u_6135", beta: false, email: "donald2@acme.io", plan: "Pro", region: "US", sessions: 23 },
  { id: "u_1188", beta: false, email: "barbara3@acme.io", plan: "Enterprise", region: "EU", sessions: 53 },
  { id: "u_5482", beta: false, email: "alex2@acme.io", plan: "Free", region: "US", sessions: 11 },
  { id: "u_2793", beta: false, email: "sophie2@acme.io", plan: "Free", region: "EU", sessions: 6 },
  { id: "u_3311", beta: false, email: "ken2@acme.io", plan: "Free", region: "NG", sessions: 13 },
  { id: "u_8846", beta: false, email: "guido2@acme.io", plan: "Pro", region: "EU", sessions: 32 },
  { id: "u_4620", beta: false, email: "ada2@acme.io", plan: "Pro", region: "US", sessions: 39 },
  { id: "u_1637", beta: false, email: "grace2@acme.io", plan: "Enterprise", region: "EU", sessions: 47 },
  { id: "u_5971", beta: false, email: "alan2@acme.io", plan: "Pro", region: "US", sessions: 18 },
  { id: "u_2088", beta: false, email: "dennis2@acme.io", plan: "Free", region: "US", sessions: 4 },
  { id: "u_7465", beta: false, email: "ron2@acme.io", plan: "Free", region: "NG", sessions: 10 },
];

/** Attribute names accepted by a rule, mapped onto `SampleUser` fields. */
const attributeAliases: Record<string, keyof SampleUser> = {
  "user.beta": "beta",
  beta: "beta",
  "user.email": "email",
  email: "email",
  "user.plan": "plan",
  plan: "plan",
  region: "region",
  "user.region": "region",
  sessions: "sessions",
  "user.sessions": "sessions",
  id: "id",
  "user.id": "id",
};

/** Normalise a value for comparison: case-insensitive, trimmed. */
function normalise(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function readAttribute(user: SampleUser, attribute: string): string {
  const field = attributeAliases[normalise(attribute)];
  if (!field) return "";
  return normalise(user[field]);
}

function matchesRule(user: SampleUser, rule: SegmentRule): boolean {
  const values = rule.values.map(normalise).filter(Boolean);
  if (values.length === 0) return false;

  const actual = readAttribute(user, rule.attribute);

  switch (rule.operator) {
    case "is":
      return actual === values[0];
    case "is not":
      return actual !== values[0];
    case "is one of":
      return values.includes(actual);
    case "ends with":
      return values.some((value) => actual.endsWith(value));
    case "starts with":
      return values.some((value) => actual.startsWith(value));
    case "greater than": {
      const threshold = Number(values[0]);
      if (Number.isNaN(threshold)) return false;
      return Number(actual) > threshold;
    }
    case "less than": {
      const threshold = Number(values[0]);
      if (Number.isNaN(threshold)) return false;
      return Number(actual) < threshold;
    }
    default:
      return false;
  }
}

/**
 * Evaluate a rule set against a user. Conditions are combined with AND.
 *
 * Pure and dependency-free so it can run both in the client-side create form
 * and in the server-rendered detail page.
 */
export function matchesSegment(
  rules: SegmentRule[],
  user: SampleUser,
): boolean {
  if (rules.length === 0) return false;
  return rules.every((rule) => matchesRule(user, rule));
}

export function matchingUsers(
  rules: SegmentRule[],
  limit?: number,
): SampleUser[] {
  const matched = sampleUsers.filter((user) => matchesSegment(rules, user));
  return limit === undefined ? matched : matched.slice(0, limit);
}

/** One-line rule description, e.g. `user.beta is true · user.plan is one of Pro`. */
export function formatRuleSummary(rules: SegmentRule[]): string {
  if (rules.length === 0) return "No rules";
  return rules
    .map(
      (rule) =>
        `${rule.attribute} ${rule.operator} ${
          rule.values.length > 0 ? rule.values.join(", ") : "any"
        }`,
    )
    .join(" · ");
}

/** The attribute a user matched on, for the preview and members table. */
export function matchedAttributes(
  rules: SegmentRule[],
  user: SampleUser,
): string[] {
  return rules
    .filter((rule) => matchesRule(user, rule))
    .map((rule) => `${rule.attribute} ${rule.operator} ${rule.values.join(", ")}`);
}

const segments: Segment[] = [
  {
    key: "beta-users",
    name: "Beta Users",
    description: "Users who opted into beta features",
    rules: [{ id: "r1", attribute: "user.beta", operator: "is", values: ["true"] }],
    flags: [
      { key: "checkout-v2", environment: "production", status: "Enabled", isRollout: false },
      { key: "dark-mode", environment: "production", status: "Enabled", isRollout: false },
      { key: "new-dashboard", environment: "production", status: "50%", isRollout: true },
      { key: "beta-banner", environment: "staging", status: "Enabled", isRollout: false },
    ],
    updatedHoursAgo: 2,
    owner: "Sarah Chen",
  },
  {
    key: "internal-team",
    name: "Internal Team",
    description: "Acme employees and contractors",
    rules: [
      { id: "r1", attribute: "user.email", operator: "ends with", values: ["@acme.io"] },
    ],
    flags: [
      { key: "checkout-v2", environment: "production", status: "Enabled", isRollout: false },
      { key: "dark-mode", environment: "production", status: "Enabled", isRollout: false },
    ],
    updatedHoursAgo: 0,
    owner: "Yusuf Adebayo",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    description: "Paying enterprise accounts",
    rules: [
      { id: "r1", attribute: "user.plan", operator: "is one of", values: ["Pro", "Enterprise"] },
    ],
    flags: [
      { key: "sso-saml", environment: "production", status: "Enabled", isRollout: false },
      { key: "checkout-v2", environment: "production", status: "Enabled", isRollout: false },
    ],
    updatedHoursAgo: 72,
    owner: "Marcus Reid",
  },
  {
    key: "eu-customers",
    name: "EU Customers",
    description: "Users located in the European Union",
    rules: [{ id: "r1", attribute: "region", operator: "is", values: ["EU"] }],
    flags: [
      { key: "dark-mode", environment: "production", status: "Enabled", isRollout: false },
      { key: "ai-summaries", environment: "production", status: "5%", isRollout: true },
    ],
    updatedHoursAgo: 0,
    owner: "Priya Nair",
  },
  {
    key: "power-users",
    name: "Power Users",
    description: "Active users with 20+ sessions",
    rules: [{ id: "r1", attribute: "sessions", operator: "greater than", values: ["20"] }],
    flags: [
      { key: "search-ranking", environment: "production", status: "50%", isRollout: true },
    ],
    updatedHoursAgo: 168,
    owner: "Liam O'Connor",
  },
];

function toView(segment: Segment, now: Date, limit?: number): SegmentView {
  return {
    key: segment.key,
    name: segment.name,
    description: segment.description,
    rules: segment.rules,
    flags: segment.flags,
    owner: segment.owner,
    updatedLabel: formatRelativeTime(hoursAgo(segment.updatedHoursAgo, now), now),
    memberCount: matchingUsers(segment.rules).length,
    members: matchingUsers(segment.rules, limit),
  };
}

/** Every segment, with member counts derived from the sample pool. */
export function getSegmentSummaries(now: Date): SegmentSummary[] {
  return segments.map((segment) => ({
    ...toView(segment, now),
    ruleSummary: formatRuleSummary(segment.rules),
  }));
}

/**
 * One segment by key.
 *
 * @returns The resolved segment, or `null` when the key is unknown.
 */
export function getSegment(
  key: string,
  now: Date,
  options: { memberLimit?: number } = {},
): SegmentView | null {
  const segment = segments.find((item) => item.key === key);
  if (!segment) return null;
  return toView(segment, now, options.memberLimit);
}

/** Keys of every segment, used to reject duplicate keys in the create form. */
export function getSegmentKeys(): string[] {
  return segments.map((segment) => segment.key);
}
