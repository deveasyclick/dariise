import { cn } from "cn";
import { auditActionMeta } from "@/components/app/audit-log/audit-action-meta";
import type {
  AuditEventGroup,
  AuditEventView,
} from "@/components/app/audit-log/audit-log-types";

interface AuditTimelineProps {
  groups: AuditEventGroup[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function AuditRow({
  event,
  selected,
  onSelect,
}: {
  event: AuditEventView;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const meta = auditActionMeta[event.action];
  const Icon = meta.icon;
  const [firstChange] = event.changes;

  return (
    <button
      type="button"
      onClick={() => onSelect(event.id)}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
        selected ? "bg-primary/5" : "hover:bg-muted",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
          meta.tone,
        )}
      >
        <Icon className="size-3.5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[12px]">
          <span className="font-medium">{event.actor}</span>{" "}
          <span className="text-muted-foreground">{event.verb}</span>
          {event.target ? (
            <>
              {" "}
              <span className="text-muted-foreground">{event.target}</span>
            </>
          ) : null}
        </span>
        <span className="text-muted-foreground mt-0.5 block truncate text-[11px]">
          {event.context}
        </span>
      </span>

      {firstChange ? (
        <span className="bg-ok-ink/10 mt-0.5 hidden max-w-56 shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] tabular-nums sm:inline-flex">
          <span className="text-muted-foreground truncate">
            {firstChange.field}
          </span>
          <span className="text-ok-ink truncate">{firstChange.value}</span>
          {event.changes.length > 1 ? (
            <span className="text-muted-foreground">
              +{event.changes.length - 1}
            </span>
          ) : null}
        </span>
      ) : null}

      <span className="text-muted-foreground mt-0.5 shrink-0 text-[10px] tabular-nums">
        {event.timeLabel}
      </span>
    </button>
  );
}

/** Events newest-first, grouped under a day heading. */
export function AuditTimeline({
  groups,
  selectedId,
  onSelect,
}: AuditTimelineProps) {
  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground px-2.5 py-10 text-center text-[12px]">
        No events match your filters.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-muted-foreground px-2.5 py-2 text-[11px] font-medium">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.events.map((event) => (
              <li key={event.id}>
                <AuditRow
                  event={event}
                  selected={event.id === selectedId}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
