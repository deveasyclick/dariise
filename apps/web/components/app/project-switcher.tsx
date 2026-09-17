"use client";

import Link from "next/link";
import {
  CheckIcon,
  ChevronDownIcon,
  FoldersIcon,
  PlusIcon,
} from "lucide-react";
import { cn } from "cn";
import { projectGlyphs } from "@/components/app/projects/project-glyphs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/lib/project-data";

interface ProjectSwitcherProps {
  /** The project the chrome is scoped to. */
  project: Project;
  /** Every project in the workspace, in the order the menu lists them. */
  projects: Project[];
}

/**
 * Project switcher in the sidebar header.
 *
 * A Client Component because Radix needs to own the trigger's ref. Switching is
 * not wired to anything yet, so the rows are selectors, disabled with a title
 * rather than pretending to load another project's flags. The footer actions
 * navigate: "Create project" opens the dashboard create screen and "Manage
 * projects" opens the projects list.
 */
export function ProjectSwitcher({ project, projects }: ProjectSwitcherProps) {
  const Glyph = projectGlyphs[project.glyph];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="bg-nav-chip border-nav-chip-line hover:border-nav-active/60 flex w-full items-center gap-2.5 rounded-lg border p-1.5 text-left transition-colors"
        >
          <span className="bg-nav-active flex size-6 shrink-0 items-center justify-center rounded-md text-white">
            <Glyph aria-hidden="true" className="size-3.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-nav-dim block text-[10px]">Project</span>
            <span className="block truncate text-[12px] font-medium text-white">
              {project.name}
            </span>
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="text-nav-dim size-3.5 shrink-0"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64 p-1.5">
        <DropdownMenuLabel className="text-muted-foreground px-1.5 text-[10px] font-medium tracking-[0.14em] uppercase">
          Projects
        </DropdownMenuLabel>

        {projects.map((item) => {
          const ItemGlyph = projectGlyphs[item.glyph];
          const current = item.key === project.key;

          return (
            <DropdownMenuItem
              key={item.key}
              disabled
              title="Switching projects — coming soon"
              className={cn("gap-2.5 px-1.5 py-1.5", current && "bg-primary/5")}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-md",
                  current
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <ItemGlyph aria-hidden="true" className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium">
                  {item.name}
                </span>
                <span className="text-muted-foreground block truncate text-[11px]">
                  {item.isDefault ? "Default · " : ""}
                  {item.environmentCount} environments
                </span>
              </span>
              {current ? (
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
          <Link href="/projects/new">
            <PlusIcon aria-hidden="true" />
            Create project
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/projects">
            <FoldersIcon aria-hidden="true" />
            Manage projects
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
