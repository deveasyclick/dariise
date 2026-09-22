import { SectionCard } from "@/components/app/page-header";
import type { LatencySummary } from "@/lib/analytics-data";

export function SdkLatencyCard({ latency }: { latency: LatencySummary }) {
  const percentiles = [
    { label: "p50", valueMs: latency.p50Ms },
    { label: "p95", valueMs: latency.p95Ms },
    { label: "p99", valueMs: latency.p99Ms },
  ];

  return (
    <SectionCard title="SDK Latency">
      <p className="text-2xl font-semibold tracking-tight tabular-nums">
        {latency.avgMs}ms
      </p>
      <p className="text-muted-foreground mt-0.5 text-[11px]">
        avg evaluation latency · last {latency.windowHours}h
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {percentiles.map((percentile) => (
          <div key={percentile.label} className="bg-muted rounded-md px-2.5 py-2">
            <p className="text-muted-foreground text-[10px]">
              {percentile.label}
            </p>
            <p className="mt-0.5 text-[12px] font-medium tabular-nums">
              {percentile.valueMs}ms
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
