import type { Metadata } from "next";
import Link from "next/link";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import {
  ActiveRolloutsCard,
  FlagHealthCard,
  RecentActivityCard,
} from "@/components/app/overview-cards";
import { StatCard } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { loadOverview } from "./load-overview";

export const metadata: Metadata = {
  title: "Overview",
  description:
    "Monitor flag health, active rollouts, and recent changes across your environments.",
};

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  // One `now` for the whole render keeps server output and hydration in step.
  const data = await loadOverview(new Date());

  if (!data) return null;

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
        <Button asChild size="sm">
          <Link href="/flags/new">
            <PlusIcon aria-hidden="true" />
            New Flag
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ActiveRolloutsCard rollouts={data.activeRollouts} />
        <FlagHealthCard health={data.flagHealth} />
      </div>

      <div className="mt-3">
        <RecentActivityCard activity={data.recentActivity} />
      </div>
    </>
  );
}
