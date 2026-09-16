/**
 * TEMPORARY AUDIT LOG MOCK DATA — not connected to anything.
 *
 * `apps/api` does not exist yet, so the Audit Log screen reads from the seeds
 * below, in the same spirit as `dashboard-data.ts` and `flag-detail-data.ts`.
 * Nothing here is fetched or persisted. When the API lands, replace
 * `getAuditLog` with a call to `@/lib/api`'s `audit.list` and delete this module.
 *
 * Two rules keep the screen honest:
 *
 *  - timestamps are `ageHours` offsets resolved against a caller-supplied `now`,
 *    as everywhere else in the fixtures, so relative labels are stable;
 *  - every label a row shows — day heading, clock time, absolute time, context
 *    line — is resolved here and passed down as a string, so the client can
 *    filter and regroup without ever re-formatting a date. That is what keeps
 *    the server render and hydration in agreement.
 *
 * The current user's name, the environment names and the Beta Users member count
 * are read from the other fixtures rather than copied, so this screen cannot
 * disagree with the screens they came from.
 */

import { getDashboardData } from "@/lib/dashboard-data";
import { getEnvironmentOptions, type EnvironmentOption } from "@/lib/environment-data";
import { getSegment } from "@/lib/segment-data";
import {
  formatClockTime,
  formatDateTime,
  formatDayLabel,
  formatInteger,
  hoursAgo,
} from "@/lib/format";
import type { AuditAction } from "@/lib/types";

/** What an event was recorded against; decides the detail panel's first row. */
export type AuditTargetKind = "flag" | "segment" | "api_key";

export interface AuditChange {
  field: string;
  before: string;
  after: string;
}

/** One event as the timeline and the details panel render it. */
export interface AuditEventView {
  id: string;
  /** Day heading, e.g. `Today`, `Yesterday`, or `12 Sep`. */
  dayLabel: string;
  actor: string;
  action: AuditAction;
  /** What the actor did, e.g. `changed rollout on`. */
  verb: string;
  target: string;
  /** The muted line under the row, e.g. `new-dashboard · Production`. */
  context: string;
  environmentKey: string | null;
  environmentName: string;
  targetKind: AuditTargetKind;
  /** Label for the target in the details panel, e.g. `Flag`. */
  targetFieldLabel: string;
  change: AuditChange | null;
  /** Clock time beside the row, e.g. `6:12 AM`. */
  timeLabel: string;
  /** Absolute time in the details panel, e.g. `Sep 15, 2026 05:31`. */
  absoluteLabel: string;
  /** Whole hours since the change; used by the range filter. */
  ageHours: number;
}

export interface AuditEventGroup {
  label: string;
  events: AuditEventView[];
}

export interface AuditLogView {
  events: AuditEventView[];
  environments: EnvironmentOption[];
  /** Distinct actors, in the order they first appear. */
  actors: string[];
  /** Events recorded in the window; only the newest few are transcribed. */
  totalEvents: number;
}

/** Marks a seed as belonging to the signed-in user; resolved at render. */
const CURRENT_USER = "current-user";

/** Events in the design's window. Seven are transcribed from it. */
const totalEvents = 1_284;

const targetFieldLabels: Record<AuditTargetKind, string> = {
  flag: "Flag",
  segment: "Segment",
  api_key: "API key",
};

/** How a row's context line is assembled. */
type AuditContextKind =
  | "target-and-environment"
  | "environment-and-sdk-key"
  | "segment-members";

interface AuditEventSeed {
  id: string;
  actor: string;
  action: AuditAction;
  verb: string;
  target: string;
  contextKind: AuditContextKind;
  environmentKey: string | null;
  targetKind: AuditTargetKind;
  change: AuditChange | null;
  ageHours: number;
}

const eventSeeds: AuditEventSeed[] = [
  {
    id: "evt_1",
    actor: CURRENT_USER,
    action: "flag.enabled",
    verb: "enabled",
    target: "checkout-v2",
    contextKind: "target-and-environment",
    environmentKey: "production",
    targetKind: "flag",
    change: null,
    ageHours: 3,
  },
  {
    id: "evt_2",
    actor: "Sarah Chen",
    action: "rollout.updated",
    verb: "changed rollout on",
    target: "new-dashboard",
    contextKind: "target-and-environment",
    environmentKey: "production",
    targetKind: "flag",
    change: { field: "Rollout", before: "25%", after: "50%" },
    ageHours: 5,
  },
  {
    id: "evt_3",
    actor: CURRENT_USER,
    action: "flag.updated",
    verb: "updated targeting rule on",
    target: "checkout-v2",
    contextKind: "target-and-environment",
    environmentKey: "production",
    targetKind: "flag",
    change: null,
    ageHours: 6,
  },
  {
    id: "evt_4",
    actor: "Mariam Okonkwo",
    action: "flag.created",
    verb: "created",
    target: "payments-v2",
    contextKind: "target-and-environment",
    environmentKey: "development",
    targetKind: "flag",
    change: null,
    ageHours: 8,
  },
  {
    id: "evt_5",
    actor: "Sarah Chen",
    action: "api_key.rotated",
    verb: "rotated API key",
    target: "ff_prod_8a2c",
    contextKind: "environment-and-sdk-key",
    environmentKey: "production",
    targetKind: "api_key",
    change: null,
    ageHours: 30,
  },
  {
    id: "evt_6",
    actor: CURRENT_USER,
    action: "flag.archived",
    verb: "archived",
    target: "legacy-cart",
    contextKind: "target-and-environment",
    environmentKey: "staging",
    targetKind: "flag",
    change: null,
    ageHours: 33,
  },
  {
    id: "evt_7",
    actor: "Sarah Chen",
    action: "segment.updated",
    verb: "updated segment",
    target: "Beta Users",
    contextKind: "segment-members",
    environmentKey: null,
    targetKind: "segment",
    change: null,
    ageHours: 38,
  },
];

/**
 * Group events under their day heading, keeping the calendar order the events
 * arrived in.
 *
 * The client calls this after filtering; the same function produces the initial
 * grouping, so a filtered and an unfiltered timeline cannot diverge.
 */
export function groupEventsByDay(events: AuditEventView[]): AuditEventGroup[] {
  const byDay = new Map<string, AuditEventView[]>();

  for (const event of events) {
    const bucket = byDay.get(event.dayLabel);
    if (bucket) bucket.push(event);
    else byDay.set(event.dayLabel, [event]);
  }

  return [...byDay].map(([label, dayEvents]) => ({ label, events: dayEvents }));
}

/**
 * Build the audit log payload.
 *
 * @param now - The moment relative labels are measured against. The page passes
 * a single value for the whole render so server and client agree.
 */
export function getAuditLog(now: Date): AuditLogView {
  const environments = getEnvironmentOptions();
  const environmentNames = new Map(
    environments.map((environment) => [environment.key, environment.name]),
  );
  const currentUserName = getDashboardData(now).currentUser.name;
  const betaUsersMembers = getSegment("beta-users", now)?.memberCount ?? 0;

  const events = eventSeeds
    .map((seed): AuditEventView => {
      const environmentName = seed.environmentKey
        ? (environmentNames.get(seed.environmentKey) ?? seed.environmentKey)
        : "";
      const createdAt = hoursAgo(seed.ageHours, now);

      const context =
        seed.contextKind === "segment-members"
          ? `${seed.target} · ${formatInteger(betaUsersMembers)} members`
          : seed.contextKind === "environment-and-sdk-key"
            ? `${environmentName} · SDK key`
            : `${seed.target} · ${environmentName}`;

      return {
        id: seed.id,
        actor: seed.actor === CURRENT_USER ? currentUserName : seed.actor,
        action: seed.action,
        verb: seed.verb,
        target: seed.target,
        context,
        environmentKey: seed.environmentKey,
        environmentName: environmentName || "Workspace",
        targetKind: seed.targetKind,
        targetFieldLabel: targetFieldLabels[seed.targetKind],
        change: seed.change,
        dayLabel: formatDayLabel(createdAt, now),
        timeLabel: formatClockTime(createdAt),
        absoluteLabel: formatDateTime(createdAt),
        ageHours: seed.ageHours,
      };
    })
    .sort((a, b) => a.ageHours - b.ageHours);

  return {
    events,
    environments,
    actors: [...new Set(events.map((event) => event.actor))],
    totalEvents,
  };
}
