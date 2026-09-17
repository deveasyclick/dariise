"use client";

import Link from "next/link";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  PlusIcon,
  ServerIcon,
} from "lucide-react";
import { cn } from "cn";
import { environmentColorSwatch } from "@/components/app/environments/environment-colors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EnvironmentOption } from "@/lib/environment-data";

interface EnvironmentSwitcherProps {
  /** Every environment in the project, in the order the menu lists them. */
  environments: EnvironmentOption[];
}

/**
 * Environment switcher below the project switcher in the sidebar.
 *
 * A Client Component because Radix needs to own the trigger's ref. The default
 * environment is the one the chrome is in — the same convention the environments
 * fixtures use to preselect a copy source. The rows are selectors: switching is
 * not wired to anything yet, so they are disabled with a title rather than
 * pretending to load another environment's flags. The footer actions do
 * navigate, because the create and manage screens already exist.
 */
export function EnvironmentSwitcher({ environments }: EnvironmentSwitcherProps) {
  const current =
    environments.find((item) => item.isDefault) ?? environments[0];

  if (!current) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hover:bg-nav-chip flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors"
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-2 shrink-0 rounded-full",
              environmentColorSwatch[current.color],
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="text-nav-dim block text-[10px]">Environment</span>
            <span className="block truncate text-[12px] font-medium text-white/90">
              {current.name}
            </span>
          </span>
          <ChevronsUpDownIcon
            aria-hidden="true"
            className="text-nav-dim size-3.5 shrink-0"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64 p-1.5">
        <DropdownMenuLabel className="text-muted-foreground px-1.5 text-[10px] font-medium tracking-[0.14em] uppercase">
          Environments
        </DropdownMenuLabel>

        {environments.map((item) => {
          const selected = item.key === current.key;

          return (
            <DropdownMenuItem
              key={item.key}
              disabled
              title="Switching environments — coming soon"
              className={cn(
                "gap-2.5 px-1.5 py-1.5",
                selected && "bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-md",
                  selected ? "bg-primary/10" : "bg-muted",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 rounded-full",
                    environmentColorSwatch[item.color],
                  )}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium">
                  {item.name}
                </span>
                <span className="text-muted-foreground block truncate font-mono text-[10px]">
                  {item.isDefault ? "Default · " : ""}
                  {item.key}
                </span>
              </span>
              {selected ? (
                <CheckIcon
                  aria-hidden="true"
                  className="text-primary size-3.5 shrink-0"
                />
              ) : null}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/environments/new">
            <PlusIcon aria-hidden="true" />
            Create environment
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/environments">
            <ServerIcon aria-hidden="true" />
            Manage environments
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
