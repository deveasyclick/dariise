import type { Metadata } from "next";
import { CalendarIcon, DownloadIcon } from "lucide-react";
import { AnalyticsStatCard } from "@/components/app/analytics/analytics-stats";
import { EvaluationsByEnvironmentCard } from "@/components/app/analytics/evaluations-by-environment";
import { EvaluationsOverTimeCard } from "@/components/app/analytics/evaluations-chart";
import { SdkLatencyCard } from "@/components/app/analytics/sdk-latency";
import { TopFlagsCard } from "@/components/app/analytics/top-flags";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getAnalyticsData } from "@/lib/analytics-data";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Evaluation volume, latency, and rollout impact across your environments.",
};

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  const data = getAnalyticsData();

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Evaluation volume, latency, and rollout impact across your environments."
      >
        <span className="bg-card text-muted-foreground inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px]">
          <CalendarIcon aria-hidden="true" className="size-3.5" />
          Last 7 days
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled
          title="Export — coming soon"
          className="gap-1.5 text-[11px]"
        >
          <DownloadIcon aria-hidden="true" className="size-3.5" />
          Export
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => (
          <AnalyticsStatCard key={stat.id} stat={stat} />
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <EvaluationsOverTimeCard series={data.series} />
          <TopFlagsCard flags={data.topFlags} />
        </div>

        <div className="space-y-3">
          <SdkLatencyCard latency={data.latency} />
          <EvaluationsByEnvironmentCard
            total={data.last24Hours.total}
            rows={data.last24Hours.rows}
          />
        </div>
      </div>
    </>
  );
}
