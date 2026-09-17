import { cn } from "cn";
import { Badge } from "@/components/ui/badge";

export type HealthStatus = "healthy" | "degraded";

/**
 * Health pill for an environment or a project.
 *
 * Colour is paired with the word itself, so the state never depends on the
 * tint alone. Used by the environment cards and headers and by the project
 * header.
 */
export function HealthBadge({ status }: { status: HealthStatus }) {
  return (
    <Badge variant={status === "healthy" ? "ok" : "warn"} className="gap-1.5">
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          status === "healthy" ? "bg-ok-ink" : "bg-warn-ink",
        )}
      />
      {status === "healthy" ? "Healthy" : "Degraded"}
    </Badge>
  );
}
