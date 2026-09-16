import Link from "next/link";
import { ProgressBar } from "@/components/app/progress-bar";
import { SectionCard } from "@/components/app/page-header";
import type { TopFlag } from "@/lib/analytics-data";
import { formatCompactNumber } from "@/lib/format";

/**
 * Flags ranked by evaluation volume.
 *
 * Each bar is a share of the busiest flag rather than a share of all traffic, so
 * the ranking reads at a glance. The keys themselves are text, as in the design;
 * the whole list is one link away.
 */
export function TopFlagsCard({ flags }: { flags: TopFlag[] }) {
  const peak = Math.max(...flags.map((flag) => flag.value), 1);

  return (
    <SectionCard
      title="Top Flags by Evaluations"
      action={
        <Link href="/flags" className="text-primary text-[11px] hover:underline">
          View all
        </Link>
      }
    >
      <ol className="space-y-3.5">
        {flags.map((flag, index) => (
          <li key={flag.key} className="flex items-center gap-3">
            <span className="text-muted-foreground w-5 shrink-0 font-mono text-[10px] tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="w-28 shrink-0 truncate font-mono text-[12px] sm:w-36">
              {flag.key}
            </span>
            <ProgressBar
              value={(flag.value / peak) * 100}
              label={`${flag.key} evaluations relative to the busiest flag`}
            />
            <span className="text-muted-foreground w-10 shrink-0 text-right text-[11px] tabular-nums">
              {formatCompactNumber(flag.value)}
            </span>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
