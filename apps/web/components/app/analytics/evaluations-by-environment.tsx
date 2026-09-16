import { cn } from "cn";
import { SectionCard } from "@/components/app/page-header";
import {
  seriesColorVar,
  seriesFillClass,
} from "@/components/app/analytics/environment-series";
import {
  sharePercentages,
  type EnvironmentShare,
} from "@/lib/analytics-data";
import { formatCompactNumber } from "@/lib/format";

/**
 * Gap between two arcs, in percent of the ring.
 *
 * It is carved out of the end of each arc, so the stops still add up to 100%
 * and the ring stays closed.
 */
const ARC_GAP = 1.5;

function buildArcGradient(
  rows: EnvironmentShare[],
  percentages: number[],
): string {
  let cursor = 0;

  const stops = rows.map((row, index) => {
    const start = cursor;
    const end = start + percentages[index];
    cursor = end;

    const last = index === rows.length - 1;
    const arcEnd = last ? end : Math.max(start, end - ARC_GAP);
    const arc = `${seriesColorVar[row.color]} ${start}% ${arcEnd}%`;

    return last ? arc : `${arc}, var(--card) ${arcEnd}% ${end}%`;
  });

  // `from -90deg` starts the first arc at twelve o'clock.
  return `conic-gradient(from -90deg, ${stops.join(", ")})`;
}

/**
 * Share of the last 24 hours per environment.
 *
 * The ring is decorative: the legend carries the same numbers as text, and the
 * percentages are rounded so they add up to 100.
 */
export function EvaluationsByEnvironmentCard({
  total,
  rows,
}: {
  total: number;
  rows: EnvironmentShare[];
}) {
  const percentages = sharePercentages(rows.map((row) => row.value));

  return (
    <SectionCard title="Evaluations by Environment">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
        <div
          aria-hidden="true"
          className="relative size-32 shrink-0 rounded-full"
          style={{ background: buildArcGradient(rows, percentages) }}
        >
          <div className="bg-card absolute inset-[18%] flex flex-col items-center justify-center rounded-full">
            <span className="text-[15px] font-semibold tracking-tight tabular-nums">
              {formatCompactNumber(total)}
            </span>
            <span className="text-muted-foreground text-[9px]">evaluations</span>
          </div>
        </div>

        <dl className="w-full space-y-2.5">
          {rows.map((row, index) => (
            <div key={row.envKey} className="flex items-center gap-2 text-[12px]">
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  seriesFillClass[row.color],
                )}
              />
              <dt className="truncate">{row.label}</dt>
              <dd className="text-muted-foreground ml-auto tabular-nums">
                {percentages[index]}%
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </SectionCard>
  );
}
