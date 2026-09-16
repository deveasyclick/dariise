import { KeyRoundIcon } from "lucide-react";
import { cn } from "cn";
import { environmentColorTone } from "@/components/app/environments/environment-colors";
import { Badge } from "@/components/ui/badge";
import { isWriteScope, scopeLabel } from "@/lib/api-key-data";
import type { EnvironmentColor } from "@/lib/environment-data";
import type { ApiKeyScope } from "@/lib/types";

/**
 * Presentational pieces of an API key row.
 *
 * Server-safe on purpose: the list's interactivity lives in the table, and none
 * of these need state.
 */

/** Icon tile for a key, tinted per environment. */
export function KeyGlyph({
  color,
  className,
}: {
  color: EnvironmentColor | null;
  className?: string;
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
  name: string;
  color: EnvironmentColor | null;
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

/**
 * One pill per permission.
 *
 * Write scopes are tinted so a key that can change configuration is
 * distinguishable at a glance from a read-only one.
 */
export function ScopePills({ scopes }: { scopes: ApiKeyScope[] }) {
  return (
    <span className="flex flex-wrap items-center gap-1">
      {scopes.map((scope) => (
        <Badge
          key={scope}
          variant="secondary"
          className={cn(
            isWriteScope(scope) && "bg-info-ink/10 text-info-ink",
          )}
        >
          {scopeLabel(scope)}
        </Badge>
      ))}
    </span>
  );
}

/** Marks the key issued in this session. */
export function NewBadge() {
  return (
    <Badge variant="ok" className="text-[10px] tracking-wide uppercase">
      New
    </Badge>
  );
}
