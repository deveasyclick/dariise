import {
  ActivityIcon,
  ShieldCheckIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import type { AnalyticsStat, AnalyticsStatId } from "@/lib/analytics-data";
import {
  formatCompactNumber,
  formatInteger,
  formatPercent,
  formatSignedPercent,
} from "@/lib/format";

/** Icon and tint per metric, matching what the number means. */
const statPresentation: Record<
  AnalyticsStatId,
  { icon: LucideIcon; tone: string }
> = {
  evaluations: { icon: ActivityIcon, tone: "bg-primary-ink/10 text-primary-ink" },
  throughput: { icon: ZapIcon, tone: "bg-info-ink/10 text-info-ink" },
  users: { icon: UsersIcon, tone: "bg-purple-ink/10 text-purple-ink" },
  "error-rate": { icon: ShieldCheckIcon, tone: "bg-ok-ink/10 text-ok-ink" },
};

/** Render a stat's value in the unit its `valueFormat` names. */
function formatValue(stat: AnalyticsStat): string {
  switch (stat.valueFormat) {
    case "compact":
      return formatCompactNumber(stat.value);
    case "integer":
      return formatInteger(stat.value);
    case "rate":
      return `${formatInteger(stat.value)}/s`;
    case "percent":
      return formatPercent(stat.value, stat.fractionDigits);
  }
}

function StatMeta({ stat }: { stat: AnalyticsStat }) {
  const { meta } = stat;

  if (meta.kind === "note") {
    return (
      <span
        className={cn(
          "text-[11px]",
          meta.tone === "ok" ? "text-ok-ink" : "text-muted-foreground",
        )}
      >
        {meta.text}
      </span>
    );
  }

  // A rising "Error Rate" would be bad, so the colour follows `positiveIsGood`.
  const improving = meta.percent > 0 === stat.positiveIsGood;
  const TrendIcon = meta.percent >= 0 ? TrendingUpIcon : TrendingDownIcon;

  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[11px]",
          improving ? "text-ok-ink" : "text-danger-ink",
        )}
      >
        <TrendIcon aria-hidden="true" className="size-3" />
        {formatSignedPercent(meta.percent)}
      </span>
      <span className="text-muted-foreground text-[11px]">{meta.label}</span>
    </span>
  );
}

/**
 * Metric card for the Analytics screen.
 *
 * Deliberately not `StatCard`: the design puts the icon and the trend on one
 * row above the value, and the caption underneath, so the two cards share a
 * palette but not a layout.
 */
export function AnalyticsStatCard({ stat }: { stat: AnalyticsStat }) {
  const presentation = statPresentation[stat.id];
  const Icon = presentation.icon;

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
        <span className="ml-auto">
          <StatMeta stat={stat} />
        </span>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
        {formatValue(stat)}
      </p>
      <p className="text-muted-foreground mt-1 text-[11px]">{stat.label}</p>
    </div>
  );
}
