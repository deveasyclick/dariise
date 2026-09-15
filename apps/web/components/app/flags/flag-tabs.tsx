"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const tabs = [
  { label: "Configuration", segment: "" },
  { label: "Targeting", segment: "targeting" },
  { label: "History", segment: "history" },
  { label: "Dependencies", segment: "dependencies" },
] as const;

/**
 * Tab bar for the flag detail screens.
 *
 * Rendered as links rather than tabs with local state so each tab is a real,
 * addressable route that can be opened directly or bookmarked. Configuration is
 * the bare route, matching the design's default tab.
 */
export function FlagTabs({ flagKey }: { flagKey: string }) {
  const pathname = usePathname();
  const base = `/flags/${flagKey}`;

  return (
    <nav aria-label="Flag sections" className="mb-4 flex gap-1 border-b">
      {tabs.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const active = pathname === href;

        return (
          <Link
            key={tab.label || "configuration"}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-[12px] transition-colors",
              active
                ? "border-primary text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
