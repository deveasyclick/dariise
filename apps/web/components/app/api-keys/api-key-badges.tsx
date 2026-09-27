import { KeyRoundIcon } from "lucide-react";
import { cn } from "cn";
import { environmentColorTone } from "@/components/app/environments/environment-colors";
import { Badge } from "@/components/ui/badge";
import type { EnvironmentColor } from "@/lib/environment-color";

export function KeyGlyph({
  color,
  className,
}: {
  readonly color: EnvironmentColor | null;
  readonly className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        color ? environmentColorTone[color] : "bg-muted text-muted-foreground",
        className,
      )}
    >
      <KeyRoundIcon className="size-4" />
    </span>
  );
}

/** The environment a key is scoped to; `All environments` when it is not. */
export function EnvironmentPill({
  name,
  color,
}: {
  readonly name: string;
  readonly color: EnvironmentColor | null;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("gap-1.5", color ? environmentColorTone[color] : undefined)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          color ? "bg-current" : "bg-primary-ink",
        )}
      />
      {name}
    </Badge>
  );
}
