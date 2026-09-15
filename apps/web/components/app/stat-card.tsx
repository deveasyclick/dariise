import {
  CalendarClockIcon,
  FlagIcon,
  ShieldCheckIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import type { HeroStat } from "@/lib/dashboard-data";
import { formatDelta } from "@/lib/format";

/** Icon and tint per stat, matching the stat's meaning rather than its order. */
const statPresentation: Record<string, { icon: LucideIcon; tone: string }> = {
  total: { icon: FlagIcon, tone: "bg-primary-ink/10 text-primary-ink" },
  evaluated: { icon: ShieldCheckIcon, tone: "bg-ok-ink/10 text-ok-ink" },
  scheduled: { icon: CalendarClockIcon, tone: "bg-info-ink/10 text-info-ink" },
  stale: { icon: TriangleAlertIcon, tone: "bg-danger-ink/10 text-danger-ink" },
};

export function StatCard({ stat }: { stat: HeroStat }) {
  const presentation = statPresentation[stat.id] ?? {
    icon: FlagIcon,
    tone: "bg-muted text-muted-foreground",
  };
  const Icon = presentation.icon;

  // A rising "Stale" count is bad, so the colour follows `positiveIsGood`.
  const improving = stat.delta === 0 ? null : stat.delta > 0 === stat.positiveIsGood;
  const TrendIcon = stat.delta >= 0 ? TrendingUpIcon : TrendingDownIcon;

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-md",
            presentation.tone,
          )}
        >
          <Icon aria-hidden="true" className="size-3.5" />
        </span>
        <span className="text-muted-foreground text-[12px]">{stat.label}</span>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight">{stat.value}</p>

      <div className="mt-1.5 flex items-center gap-2">
        {stat.delta === 0 ? (
          <span className="text-muted-foreground text-[11px]">No change</span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px]",
              improving ? "text-ok-ink" : "text-danger-ink",
            )}
          >
            <TrendIcon aria-hidden="true" className="size-3" />
            {formatDelta(stat.delta)}
          </span>
        )}
        {stat.footnote ? (
          <span className="text-muted-foreground text-[11px]">
            · {stat.footnote}
          </span>
        ) : null}
      </div>
    </div>
  );
}
