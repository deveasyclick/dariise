import type { FlagCoverageState } from "@dariise/contracts";
import { Badge } from "@/components/ui/badge";

interface CoverageStatePillProps {
  state: FlagCoverageState;
  /**
   * `short` (the default) suits dense coverage tables — `ON` / `OFF`. `long`
   * spells the state out (`Enabled` / `Disabled`) for the project flag lists,
   * where there is room for it.
   */
  label?: "short" | "long";
}

/**
 * Effective state of one flag in one environment.
 *
 * Kept in its own module so the create screen's flag preview can render it from
 * a Client Component without pulling the coverage tables into the browser
 * bundle.
 */
export function CoverageStatePill({
  state,
  label = "short",
}: CoverageStatePillProps) {
  if (state.kind === "on") {
    return (
      <Badge variant="ok" className="gap-1.5">
        <span aria-hidden="true" className="bg-ok-ink size-1.5 rounded-full" />
        {label === "long" ? "Enabled" : "ON"}
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
      {label === "long" ? "Disabled" : "OFF"}
    </Badge>
  );
}
