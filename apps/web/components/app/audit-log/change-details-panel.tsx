import { UndoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuditEventView } from "@/lib/audit-log-data";

/**
 * Detail panel for the selected event.
 *
 * Read-only, so it stays a Server Component boundary-free child of the view; the
 * revert action is disabled and marked as such rather than pretending to work.
 */
export function ChangeDetailsPanel({ event }: { event: AuditEventView | null }) {
  if (event === null) {
    return (
      <section className="bg-card self-start rounded-lg border lg:sticky lg:top-0">
        <header className="border-b px-4 py-3">
          <h2 className="text-[13px] font-medium">Change details</h2>
        </header>
        <p className="text-muted-foreground p-4 text-[12px]">
          Select an event to see what changed.
        </p>
      </section>
    );
  }

  const rows = [
    { label: event.targetFieldLabel, value: event.target, mono: true },
    { label: "Environment", value: event.environmentName, mono: false },
    { label: "Changed by", value: event.actor, mono: false },
    { label: "Time", value: event.absoluteLabel, mono: true },
  ];

  return (
    <section className="bg-card self-start rounded-lg border lg:sticky lg:top-0">
      <header className="border-b px-4 py-3">
        <h2 className="text-[13px] font-medium">Change details</h2>
      </header>

      <div className="p-4">
        <dl className="divide-y text-[12px]">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 py-2.5 first:pt-0"
            >
              <dt className="text-muted-foreground shrink-0">{row.label}</dt>
              <dd
                className={
                  row.mono
                    ? "truncate text-right font-mono tabular-nums"
                    : "truncate text-right"
                }
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {event.change ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-muted rounded-md px-3 py-2">
              <p className="text-muted-foreground text-[10px]">Before</p>
              <p className="mt-1 text-[15px] font-semibold tracking-tight tabular-nums">
                {event.change.before}
              </p>
            </div>
            <div className="bg-ok-ink/10 rounded-md px-3 py-2">
              <p className="text-ok-ink/80 text-[10px]">After</p>
              <p className="text-ok-ink mt-1 text-[15px] font-semibold tracking-tight tabular-nums">
                {event.change.after}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground mt-3 rounded-lg border border-dashed p-3 text-[11px]">
            No field changes recorded for this event.
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          disabled
          title="Revert — coming soon"
          className="mt-3 w-full gap-1.5 text-[11px]"
        >
          <UndoIcon aria-hidden="true" className="size-3.5" />
          Revert this change
        </Button>
      </div>
    </section>
  );
}
