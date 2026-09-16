"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BlocksIcon,
  CreditCardIcon,
  SettingsIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

const sections: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: "General", href: "/settings", icon: SettingsIcon },
  { label: "Security", href: "/settings/security", icon: ShieldCheckIcon },
  {
    label: "Integrations",
    href: "/settings/integrations",
    icon: BlocksIcon,
  },
  { label: "Billing", href: "/settings/billing", icon: CreditCardIcon },
];

/**
 * Sub-navigation for the Settings screens.
 *
 * Links rather than local tab state, so each section is a real, addressable
 * route that can be opened or bookmarked directly — the same rule the flag,
 * segment and environment tabs follow. The active section is the one whose
 * path matches exactly; `/settings` is General.
 */
export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings sections" className="lg:sticky lg:top-0">
      <ul className="space-y-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const active = pathname === section.href;

          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] transition-colors",
                  active
                    ? "bg-card text-foreground border font-medium"
                    : "text-muted-foreground hover:bg-muted/60 border border-transparent",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "size-4 shrink-0",
                    active ? "text-primary" : undefined,
                  )}
                />
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
