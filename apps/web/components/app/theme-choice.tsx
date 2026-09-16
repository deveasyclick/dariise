import { cn } from "cn";
import { themeOptions, type WorkspaceTheme } from "@/lib/settings-data";

/**
 * The Light / Dark / System control.
 *
 * Presentational and disabled: the design tokens already ship dark values, but
 * nothing switches them yet and a stored preference would have to come from the
 * API. It is marked as coming soon rather than pretending to apply, and shared
 * by the workspace Appearance card and the personal Preferences card so the two
 * cannot drift.
 */
export function ThemeChoice({ theme }: { theme: WorkspaceTheme }) {
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      aria-disabled="true"
      title="Theme — coming soon"
      className="bg-muted inline-flex shrink-0 items-center gap-1 rounded-lg p-1"
    >
      {themeOptions.map((option) => {
        const active = option.value === theme;

        return (
          <span
            key={option.value}
            role="radio"
            aria-checked={active}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px]",
              active
                ? "bg-card text-foreground border font-medium"
                : "text-muted-foreground",
            )}
          >
            {option.label}
          </span>
        );
      })}
    </div>
  );
}
