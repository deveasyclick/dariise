import { cn } from "cn";
import { SectionCard } from "@/components/app/page-header";
import { seriesFillClass } from "@/components/app/analytics/environment-series";
import type { EvaluationSeries } from "@/lib/analytics-data";

/**
 * The tallest bar is drawn at 88% of the plot so its total label still fits
 * above it — the same headroom the design leaves.
 */
const PEAK_HEIGHT = 88;

/** Stacked evaluation volume per day, CSS-only. A chart library is not justified yet. */
export function EvaluationsOverTimeCard({
  series,
}: {
  series: EvaluationSeries;
}) {
  const peak = Math.max(...series.points.map((point) => point.total), 1);

  const legend = (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {series.series.map((entry) => (
        <li
          key={entry.envKey}
          className="text-muted-foreground flex items-center gap-1.5 text-[11px]"
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-2 shrink-0 rounded-full",
              seriesFillClass[entry.color],
            )}
          />
          {entry.label}
        </li>
      ))}
    </ul>
  );

  return (
    <SectionCard title="Evaluations Over Time" action={legend}>
      <div className="flex h-40 items-end gap-2 sm:h-48 sm:gap-3">
        {series.points.map((point) => (
          <div
            key={point.label}
            className="flex h-full min-w-0 flex-1 flex-col justify-end"
          >
            <span className="text-muted-foreground text-center text-[10px] tabular-nums">
              {point.total}
            </span>
            <div
              aria-hidden="true"
              className="flex flex-col justify-end gap-px"
              style={{ height: `${(point.total / peak) * PEAK_HEIGHT}%` }}
            >
              {series.series.map((entry) => (
                <div
                  key={entry.envKey}
                  className={cn(
                    "w-full rounded-[2px]",
                    seriesFillClass[entry.color],
                  )}
                  style={{
                    height: `${((point.values[entry.envKey] ?? 0) / point.total) * 100}%`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2 sm:gap-3">
        {series.points.map((point) => (
          <span
            key={point.label}
            className="text-muted-foreground flex-1 text-center text-[10px]"
          >
            {point.label}
          </span>
        ))}
      </div>
    </SectionCard>
  );
}
