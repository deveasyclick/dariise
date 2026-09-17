import {
  CalendarClockIcon,
  CircleCheckIcon,
  FlagIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import type { HeroStat, HeroStatId } from "@/lib/dashboard-data";

/** Icon and tint per stat, matching the stat's meaning rather than its order. */
const statPresentation: Record<
  HeroStatId,
  { icon: LucideIcon; tone: string }
> = {
  total: { icon: FlagIcon, tone: "bg-info-ink/10 text-info-ink" },
  enabled: { icon: CircleCheckIcon, tone: "bg-ok-ink/10 text-ok-ink" },
  scheduled: {
    icon: CalendarClockIcon,
    tone: "bg-primary-ink/10 text-primary-ink",
  },
  stale: { icon: TriangleAlertIcon, tone: "bg-muted text-muted-foreground" },
};

export function StatCard({ stat }: { stat: HeroStat }) {
  const { icon: Icon, tone } = statPresentation[stat.id];

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md",
            tone,
          )}
        >
          <Icon aria-hidden="true" className="size-3.5" />
        </span>
        <span className="text-muted-foreground truncate text-[11px]">
          {stat.note}
        </span>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight">{stat.value}</p>
      <p className="text-muted-foreground mt-1.5 text-[12px]">{stat.label}</p>
    </div>
  );
}
