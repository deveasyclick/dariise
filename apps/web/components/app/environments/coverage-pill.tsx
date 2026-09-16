import { Badge } from "@/components/ui/badge";
import type { FlagCoverageState } from "@/lib/environment-data";

/**
 * Effective state of one flag in one environment.
 *
 * Kept in its own module so the create screen's flag preview can render it from
 * a Client Component without pulling the coverage tables into the browser
 * bundle.
 */
export function CoverageStatePill({
  state,
}: {
  state: FlagCoverageState;
}) {
  if (state.kind === "on") {
    return (
      <Badge variant="ok" className="gap-1.5">
        <span aria-hidden="true" className="bg-ok-ink size-1.5 rounded-full" />
        ON
      </Badge>
    );
  }

  if (state.kind === "percentage") {
    return (
      <Badge variant="secondary" className="bg-info-ink/10 text-info-ink gap-1.5">
        <span aria-hidden="true" className="bg-info-ink size-1.5 rounded-full" />
        {state.percentage ?? 0}%
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5">
      <span
        aria-hidden="true"
        className="bg-muted-foreground size-1.5 rounded-full"
      />
      OFF
    </Badge>
  );
}
