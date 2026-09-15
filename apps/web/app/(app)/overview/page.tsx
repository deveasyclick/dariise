import type { Metadata } from "next";
import { CalendarIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import {
  ActiveRolloutsCard,
  EvaluateSummaryCard,
  FlagHealthCard,
  RecentActivityCard,
} from "@/components/app/overview-cards";
import { StatCard } from "@/components/app/stat-card";
import { getDashboardData } from "@/lib/dashboard-data";

export const metadata: Metadata = {
  title: "Overview",
  description:
    "Monitor flag health, active rollouts, and recent changes across your environments.",
};

export const dynamic = "force-dynamic";

export default function OverviewPage() {
  // One `now` for the whole render keeps server output and hydration in step.
  const data = getDashboardData(new Date());

  return (
    <>
      <PageHeader
        title="Overview"
        description="Monitor flag health, active rollouts, and recent changes across your environments."
      >
        <span className="bg-card text-muted-foreground inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px]">
          <CalendarIcon aria-hidden="true" className="size-3.5" />
          Last 7 days
        </span>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <ActiveRolloutsCard rollouts={data.activeRollouts} />
        <FlagHealthCard health={data.flagHealth} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <RecentActivityCard activity={data.recentActivity} />
        <EvaluateSummaryCard summary={data.evaluateSummary} />
      </div>
    </>
  );
}
