import { UserCheckIcon } from "lucide-react";
import type { SegmentView } from "@/lib/segment-data";

/** Definition tab — the summary grid shown beside the rules. */
export function SegmentSummaryCard({ segment }: { segment: SegmentView }) {
  const cells: Array<[string, string | number]> = [
    ["Members", segment.memberCount.toLocaleString("en-GB")],
    ["Flags", segment.flags.length],
    ["Updated", segment.updatedLabel],
    ["Type", "Dynamic"],
  ];

  return (
    <section className="bg-card rounded-lg border p-4">
      <h2 className="text-[13px] font-medium">Summary</h2>

      <dl className="mt-3 grid grid-cols-2 gap-3">
        {cells.map(([label, value]) => (
          <div key={label} className="bg-muted/50 rounded-lg border p-3">
            <dt className="text-muted-foreground text-[11px]">{label}</dt>
            <dd className="mt-1 text-xl font-semibold tracking-tight">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-muted-foreground text-[11px]">Owner</span>
        <span className="inline-flex items-center gap-1.5 text-[11px]">
          <span className="bg-primary-ink/10 text-primary-ink flex size-5 items-center justify-center rounded-full">
            <UserCheckIcon aria-hidden="true" className="size-3" />
          </span>
          {segment.owner}
        </span>
      </div>
    </section>
  );
}
