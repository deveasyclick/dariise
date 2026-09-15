import {
  KeyRoundIcon,
  LayersIcon,
  PenLineIcon,
  ToggleRightIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { SectionCard } from "@/components/app/page-header";
import { ProgressBar } from "@/components/app/progress-bar";
import type {
  ActivityKind,
  ActiveRollout,
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
        <span className="text-muted-foreground text-[11px]">View all</span>
      }
    >
      {rollouts.length === 0 ? (
        <p className="text-muted-foreground text-[13px]">
          No rollouts in progress.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {rollouts.map((rollout) => (
            <li key={rollout.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate font-mono text-[12px]">
                  {rollout.key}
                </span>
                <span className="text-muted-foreground text-[11px] capitalize">
                  {rollout.environment}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <ProgressBar
                  value={rollout.percentage}
                  label={`${rollout.key} rollout`}
                />
                <span className="text-muted-foreground w-8 shrink-0 text-right text-[11px]">
                  {rollout.percentage}%
                </span>
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
      action={<span className="text-muted-foreground text-[11px]">Details</span>}
    >
      <ul className="space-y-4">
        {health.map((entry) => {
          const TrendIcon = entry.delta >= 0 ? TrendingUpIcon : TrendingDownIcon;

          return (
            <li key={entry.environment}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12px] font-medium">
                  {entry.environment}
                </span>
                <span className="text-[13px] font-semibold">
                  {entry.percentage}%
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px]",
                    entry.delta > 0
                      ? "text-ok-ink"
                      : entry.delta < 0
                        ? "text-danger-ink"
                        : "text-muted-foreground",
                  )}
                >
                  <TrendIcon aria-hidden="true" className="size-3" />
                  {entry.delta > 0 ? "+" : ""}
                  {entry.delta}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {entry.changedFlags} of {entry.totalFlags} flags
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

const activityIcons: Record<ActivityKind, LucideIcon> = {
  toggle: ToggleRightIcon,
  rollout: TrendingUpIcon,
  segment: LayersIcon,
  comment: PenLineIcon,
  key: KeyRoundIcon,
};

export function RecentActivityCard({
  activity,
}: {
  activity: RecentActivity[];
}) {
  return (
    <SectionCard
      title="Recent Activity"
      action={<span className="text-muted-foreground text-[11px]">View all</span>}
    >
      <ul className="divide-y">
        {activity.map((entry) => {
          const Icon = activityIcons[entry.kind];

          return (
            <li
              key={entry.id}
              className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0"
            >
              <span className="bg-muted text-muted-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded">
                <Icon aria-hidden="true" className="size-3" />
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
  const peak = Math.max(...summary.bars, 1);

  return (
    <SectionCard title="Evaluation">
      <p className="text-2xl font-semibold tracking-tight">
        {formatCompactNumber(summary.totalRequests)}
      </p>
      <p className="text-muted-foreground mt-0.5 text-[11px]">
        Total requests · last {summary.windowHours}h
      </p>

      {/* CSS-only bar chart — a real chart library is not justified yet. */}
      <div
        aria-hidden="true"
        className="mt-4 flex h-16 items-end gap-1.5"
      >
        {summary.bars.map((bar, index) => (
          <div
            key={index}
            className="bg-primary-ink/70 flex-1 rounded-sm"
            style={{ height: `${Math.max(8, (bar / peak) * 100)}%` }}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <span className="text-muted-foreground text-[11px]">
          p95 <span className="text-foreground font-medium">{summary.p95Ms}ms</span>
        </span>
        <span className="text-muted-foreground text-[11px]">
          p99 <span className="text-foreground font-medium">{summary.p99Ms}ms</span>
        </span>
      </div>
    </SectionCard>
  );
}
