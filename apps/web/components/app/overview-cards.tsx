import Link from "next/link";
import {
  FlagIcon,
  KeyRoundIcon,
  PercentIcon,
  PlusIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { sectionActionClass, SectionCard } from "@/components/app/page-header";
import { ProgressBar } from "@/components/app/progress-bar";
import type {
  ActiveRollout,
  ActivityKind,
  EvaluateSummary,
  FlagHealth,
  RecentActivity,
} from "@/lib/dashboard-data";
import { formatCompactNumber } from "@/lib/format";



export function ActiveRolloutsCard({
  rollouts,
}: {
  rollouts: ActiveRollout[];
}) {
  return (
    <SectionCard
      title="Active Rollouts"
      action={
        <Link href="/flags" className={sectionActionClass}>
          View all
        </Link>
      }
    >
      {rollouts.length === 0 ? (
        <p className="text-muted-foreground text-[13px]">
          No rollouts in progress.
        </p>
      ) : (
        <ul className="space-y-4">
          {rollouts.map((rollout) => (
            <li key={`${rollout.flagKey}-${rollout.environment}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-mono text-[12px]">
                    {rollout.flagKey}
                  </span>
                  <span className="bg-muted text-muted-foreground shrink-0 rounded-md px-1.5 py-0.5 text-[10px]">
                    {rollout.environment}
                  </span>
                </span>
                <span className="text-muted-foreground shrink-0 text-[11px]">
                  {rollout.percentage}%
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar
                  value={rollout.percentage}
                  className="bg-primary"
                  label={`${rollout.flagKey} rollout`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function FlagHealthCard({ health }: { health: FlagHealth[] }) {
  return (
    <SectionCard
      title="Flag Health"
      action={
        <Link href="/environments" className={sectionActionClass}>
          Details
        </Link>
      }
    >
      <ul className="space-y-4">
        {health.map((entry) => {
          const total = entry.enabled + entry.disabled;
          const percentage =
            total === 0 ? 0 : Math.round((entry.enabled / total) * 100);

          return (
            <li key={entry.environment}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12px]">{entry.environment}</span>
                <span className="text-muted-foreground text-[11px]">
                  {entry.enabled} on · {entry.disabled} off
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar
                  value={percentage}
                  className="bg-success"
                  label={`${entry.environment} flag health`}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

/** Icon and tint per activity kind, matching the kind's meaning. */
const activityPresentation: Record<
  ActivityKind,
  { icon: LucideIcon; tone: string }
> = {
  enabled: { icon: FlagIcon, tone: "bg-ok-ink/10 text-ok-ink" },
  rollout: { icon: PercentIcon, tone: "bg-primary-ink/10 text-primary-ink" },
  created: { icon: PlusIcon, tone: "bg-info-ink/10 text-info-ink" },
  segment: { icon: UsersIcon, tone: "bg-purple-ink/10 text-purple-ink" },
  key: { icon: KeyRoundIcon, tone: "bg-muted text-muted-foreground" },
};

export function RecentActivityCard({
  activity,
}: {
  activity: RecentActivity[];
}) {
  return (
    <SectionCard
      title="Recent Activity"
      action={
        <Link href="/audit-log" className={sectionActionClass}>
          View all
        </Link>
      }
    >
      <ul className="divide-y">
        {activity.map((entry) => {
          const { icon: Icon, tone } = activityPresentation[entry.kind];

          return (
            <li
              key={entry.id}
              className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0"
            >
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md",
                  tone,
                )}
              >
                <Icon aria-hidden="true" className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[12px]">{entry.title}</p>
                <p className="text-muted-foreground truncate text-[11px]">
                  {entry.description}
                </p>
              </div>
              <span className="text-muted-foreground shrink-0 text-[10px]">
                {entry.ageLabel}
              </span>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

export function EvaluateSummaryCard({
  summary,
}: {
  summary: EvaluateSummary;
}) {
  const latencies = [
    { label: "p50", value: `${summary.p50Ms}ms` },
    { label: "p95", value: `${summary.p95Ms}ms` },
    { label: "p99", value: `${summary.p99Ms}ms` },
  ];

  return (
    <section className="bg-card rounded-lg border p-4">
      <p className="text-2xl font-semibold tracking-tight">
        {formatCompactNumber(summary.perMinute)}
      </p>
      <p className="text-muted-foreground mt-0.5 text-[11px]">
        evaluations / minute
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        {latencies.map((latency) => (
          <div
            key={latency.label}
            className="bg-muted rounded-md px-2.5 py-2"
          >
            <dt className="text-muted-foreground text-[10px]">
              {latency.label}
            </dt>
            <dd className="mt-0.5 text-[13px] font-medium">{latency.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
