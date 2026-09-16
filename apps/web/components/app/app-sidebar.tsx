"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon, MenuIcon } from "lucide-react";
import { cn } from "cn";
import { Logo } from "@/components/logo";
import { navSections } from "@/components/app/nav-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CurrentUser } from "@/lib/dashboard-data";

interface SidebarProps {
  user: CurrentUser;
  /** Owned by the settings fixtures — see `lib/settings-data.ts`. */
  workspaceName: string;
  environmentLabel: string;
}

/** The shared nav list. Rendered by both the sidebar and the mobile drawer. */
function NavList() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-4">
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="text-nav-dim/70 px-2.5 pb-1.5 text-[10px] font-medium tracking-[0.14em] uppercase">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;

              if (!item.href) {
                return (
                  <li key={item.label}>
                    <span
                      aria-disabled="true"
                      title={`${item.label} — coming soon`}
                      className="text-nav-dim/55 flex cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px]"
                    >
                      <Icon aria-hidden="true" className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                      <span className="border-nav-chip-line text-nav-dim/70 ml-auto rounded-full border px-1.5 py-px text-[9px] tracking-wide uppercase">
                        Soon
                      </span>
                    </span>
                  </li>
                );
              }

              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                      active
                        ? "bg-nav-active text-white"
                        : "text-nav-dim hover:bg-nav-chip hover:text-white",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserChip({ user }: { user: CurrentUser }) {
  return (
    <div className="border-nav-line flex items-center gap-2.5 border-t pt-3">
      <span className="bg-nav-active flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white">
        {user.initials}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-medium text-white">
          {user.name}
        </span>
        <span className="text-nav-dim block truncate text-[10px]">{user.role}</span>
      </span>
    </div>
  );
}

/** Fixed desktop sidebar. Hidden below `lg`; `MobileNav` covers small screens. */
export function AppSidebar({
  user,
  workspaceName,
  environmentLabel,
}: SidebarProps) {
  return (
    <aside className="bg-nav-bg hidden w-56 shrink-0 flex-col justify-between p-3 lg:flex">
      <div>
        <div className="flex items-center gap-2 px-1.5 py-2">
          <Logo className="size-5 text-white" />
          <span className="text-[13px] font-semibold tracking-tight text-white">
            Dariise
          </span>
        </div>

        <div className="bg-nav-chip border-nav-chip-line text-nav-dim mt-1 mb-4 flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px]">
          <span className="truncate text-white/90">{workspaceName}</span>
          <span className="opacity-60">·</span>
          <span className="truncate">{environmentLabel}</span>
          <ChevronDownIcon aria-hidden="true" className="ml-auto size-3.5" />
        </div>

        <NavList />
      </div>

      <UserChip user={user} />
    </aside>
  );
}

/** Hamburger + drawer shown only below `lg`. */
export function MobileNav() {
  return (
    <div className="lg:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Open navigation"
          className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-8 items-center justify-center rounded-md transition-colors"
        >
          <MenuIcon aria-hidden="true" className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-3">
          {navSections.map((section) => (
            <div key={section.label} className="mt-1">
              <p className="text-muted-foreground px-2 pb-1 text-[10px] font-medium tracking-[0.14em] uppercase">
                {section.label}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                return item.href ? (
                  <DropdownMenuItem key={item.label} asChild>
                    <Link href={item.href}>
                      <Icon aria-hidden="true" className="size-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    key={item.label}
                    disabled
                    className="text-muted-foreground"
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {item.label}
                    <span className="ml-auto text-[9px] tracking-wide uppercase">
                      Soon
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
