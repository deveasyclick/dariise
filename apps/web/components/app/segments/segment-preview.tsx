import { FlaskConicalIcon, UserCheckIcon } from "lucide-react";
import { cn } from "cn";
import {
  matchedAttributes,
  type SampleUser,
  type SegmentRule,
} from "@/lib/segment-data";

/** The matched or unmatched chip used by the preview and members table. */
export function MatchChip({ matched }: { matched: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px]",
        matched
          ? "bg-ok-ink/10 text-ok-ink"
          : "bg-muted text-muted-foreground",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          matched ? "bg-ok-ink" : "bg-muted-foreground",
        )}
      />
      {matched ? "matched" : "no match"}
    </span>
  );
}

/**
 * Live preview of sample users against the segment's rules.
 *
 * Server-rendered: the evaluation happens in `lib/segment-data.ts`, so this
 * needs no client boundary.
 */
export function SegmentLivePreview({
  members,
  rules,
}: {
  members: SampleUser[];
  rules: SegmentRule[];
}) {
  return (
    <section className="bg-card rounded-lg border p-4">
      <h2 className="text-[13px] font-medium">Live preview</h2>
      <p className="text-muted-foreground mt-1 text-[11px]">
        Sample users matching right now.
      </p>

      {members.length === 0 ? (
        <p className="text-muted-foreground mt-3 rounded-lg border border-dashed p-3 text-[12px]">
          No sample users match these rules.
        </p>
      ) : (
        <ul className="mt-3 divide-y">
          {members.map((user) => (
            <li
              key={user.id}
              className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-start gap-2">
                <span className="bg-muted text-muted-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                  <UserCheckIcon aria-hidden="true" className="size-3" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-[11px]">{user.id}</p>
                  <p className="text-muted-foreground truncate font-mono text-[10px]">
                    {matchedAttributes(rules, user).join(" · ")}
                  </p>
                </div>
              </div>
              <MatchChip matched />
            </li>
          ))}
        </ul>
      )}

      <p className="text-muted-foreground mt-3 flex items-center gap-1.5 border-t pt-3 text-[10px]">
        <FlaskConicalIcon aria-hidden="true" className="size-3" />
        Evaluated against the sample audience, not live traffic.
      </p>
    </section>
  );
}
