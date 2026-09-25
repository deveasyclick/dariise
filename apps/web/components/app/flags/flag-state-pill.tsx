import { Badge } from "@/components/ui/badge";

export type FlagState =
  | { kind: "on" }
  | { kind: "off" }
  | { kind: "percentage"; percentage: number };

/** How one flag resolves, from the state the flag row itself carries. */
export function flagState(state: {
  enabled: boolean;
  rolloutPercentage: number;
}): FlagState {
  if (!state.enabled || state.rolloutPercentage <= 0) return { kind: "off" };
  if (state.rolloutPercentage >= 100) return { kind: "on" };

  return { kind: "percentage", percentage: state.rolloutPercentage };
}

/**
 * Effective state of one flag in one environment.
 *
 * Kept in its own module so a Client Component can render it without pulling a
 * whole flag screen into the browser bundle.
 */
export function FlagStatePill({
  state,
  label = "short",
}: {
  state: FlagState;
  /**
   * `short` (the default) suits dense tables — `ON` / `OFF`. `long` spells the
   * state out (`Enabled` / `Disabled`) where there is room for it.
   */
  label?: "short" | "long";
}) {
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
        {state.percentage}%
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
