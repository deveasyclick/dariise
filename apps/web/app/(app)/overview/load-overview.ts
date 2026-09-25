import {
  MAX_PAGE_SIZE,
  type EnvironmentSummary,
  type FlagSummary,
} from "@dariise/contracts";
import { auditActionMeta } from "@/components/app/audit-log/audit-action-meta";
import type {
  ActiveRollout,
  FlagHealth,
  RecentActivity,
} from "@/components/app/overview-cards";
import type { HeroStat } from "@/components/app/stat-card";
import * as api from "@/lib/api";
import { formatInteger, formatRelativeTime } from "@/lib/format";
import { getScope } from "@/lib/scope";

const ACTIVITY_WINDOW_HOURS = 24 * 7;
const ACTIVITY_LIMIT = 6;
const HOUR_MS = 60 * 60 * 1000;

export interface OverviewData {
  stats: HeroStat[];
  activeRollouts: ActiveRollout[];
  flagHealth: FlagHealth[];
  recentActivity: RecentActivity[];
}

async function listFlagsIn(
  projectKey: string,
  environmentKey: string,
): Promise<FlagSummary[]> {
  const flags: FlagSummary[] = [];
  let cursor: string | undefined;

  do {
    const page = await api.flags.list(projectKey, {
      environmentKey,
      limit: MAX_PAGE_SIZE,
      ...(cursor === undefined ? {} : { cursor }),
    });

    flags.push(...page.data);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  return flags;
}

interface EnvironmentFlags {
  environment: EnvironmentSummary;
  flags: FlagSummary[];
}

async function listProjectFlags(
  projectKey: string,
  environments: EnvironmentSummary[],
): Promise<EnvironmentFlags[]> {
  return Promise.all(
    environments.map(async (environment) => ({
      environment,
      flags: await listFlagsIn(projectKey, environment.key),
    })),
  );
}

function isRollingOut(state: {
  enabled: boolean;
  rolloutPercentage: number;
}): boolean {
  return (
    state.enabled &&
    state.rolloutPercentage >= 1 &&
    state.rolloutPercentage <= 99
  );
}

export async function loadOverview(now: Date): Promise<OverviewData | null> {
  const { project, environments, environment } = await getScope();

  if (!project) return null;

  const [flagsByEnvironment, activityPage] = await Promise.all([
    listProjectFlags(project.key, environments),
    api.audit.listForProject(project.key, {
      limit: ACTIVITY_LIMIT,
      from: new Date(
        now.getTime() - ACTIVITY_WINDOW_HOURS * HOUR_MS,
      ).toISOString(),
    }),
  ]);

  const flags = flagsByEnvironment.flatMap((entry) => entry.flags);
  const selectedKey = environment?.key ?? null;
  const scopeNote = environment?.name ?? "No environment";
  const selectedFlags =
    selectedKey === null
      ? []
      : flags.filter((flag) => flag.environmentKey === selectedKey);

  const enabledCount =
    selectedKey === null
      ? null
      : selectedFlags.filter((flag) => flag.enabled).length;

  const rolloutCount =
    selectedKey === null
      ? null
      : selectedFlags.filter((flag) => isRollingOut(flag)).length;

  const archivedCount = flags.filter(
    (flag) => flag.status === "archived",
  ).length;

  const stats: HeroStat[] = [
    {
      id: "total",
      label: "Total Flags",
      value: formatInteger(flags.length),
      note: project.name,
    },
    {
      id: "enabled",
      label: "Enabled",
      value: enabledCount === null ? "Unavailable" : formatInteger(enabledCount),
      note: scopeNote,
    },
    {
      id: "rollout",
      label: "In Rollout",
      value: rolloutCount === null ? "Unavailable" : formatInteger(rolloutCount),
      note: scopeNote,
    },
    {
      id: "archived",
      label: "Archived",
      value: formatInteger(archivedCount),
      note: "All environments",
    },
  ];

  const activeRollouts: ActiveRollout[] = flags
    .filter((flag) => isRollingOut(flag))
    .map((flag) => ({
      flagKey: flag.key,
      environment: flag.environmentName,
      percentage: flag.rolloutPercentage,
    }));

  activeRollouts.sort(
    (a, b) =>
      b.percentage - a.percentage || a.flagKey.localeCompare(b.flagKey),
  );

  const flagHealth: FlagHealth[] = flagsByEnvironment.map(
    ({ environment: entry, flags: environmentFlags }) => ({
      environment: entry.name,
      enabled: environmentFlags.filter((flag) => flag.enabled).length,
      disabled: environmentFlags.filter((flag) => !flag.enabled).length,
    }),
  );

  const flagKeyById = new Map(flags.map((flag) => [flag.id, flag.key]));
  const environmentNameById = new Map(
    environments.map((entry) => [entry.id, entry.name]),
  );

  const recentActivity: RecentActivity[] = activityPage.data.map((entry) => {
    const verb = auditActionMeta[entry.action].verb;
    const environmentName =
      entry.environmentId === null
        ? null
        : (environmentNameById.get(entry.environmentId) ?? null);

    return {
      id: entry.id,
      action: entry.action,
      title:
        entry.target === null
          ? project.key
          : (flagKeyById.get(entry.target) ?? entry.target),
      description: [
        environmentName ? `${verb} in ${environmentName}` : verb,
        entry.actor,
      ].join(" · "),
      ageLabel: formatRelativeTime(entry.createdAt, now),
    };
  });

  return { stats, activeRollouts, flagHealth, recentActivity };
}
