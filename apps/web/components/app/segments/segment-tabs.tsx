"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const tabs = [
  { label: "Definition", segment: "" },
  { label: "Members", segment: "members" },
  { label: "Flags", segment: "flags" },
] as const;

/**
 * Tab bar for the segment detail screens.
 *
 * Links rather than local state, so each tab is a real addressable route.
 * Definition is the bare route, matching the design's default tab.
 */
export function SegmentTabs({ segmentKey }: { segmentKey: string }) {
  const pathname = usePathname();
  const base = `/segments/${segmentKey}`;

  return (
    <nav aria-label="Segment sections" className="mb-4 flex gap-1 border-b">
      {tabs.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const active = pathname === href;

        return (
          <Link
            key={tab.label}
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
