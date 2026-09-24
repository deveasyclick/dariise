"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FilterIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SearchIcon,
} from "lucide-react";
import { cn } from "cn";
import type { WorkspaceFlagSummary } from "@dariise/contracts";
import { ProgressBar } from "@/components/app/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/format";

type StatusView = "active" | "rollout" | "disabled" | "archived";

type StatusFilter = "all" | StatusView;

const statusPresentation: Record<
  StatusView,
  { label: string; variant: "ok" | "warn" | "outline" }
> = {
  active: { label: "Active", variant: "ok" },
  rollout: { label: "Rollout", variant: "warn" },
  disabled: { label: "Disabled", variant: "outline" },
  archived: { label: "Archived", variant: "outline" },
};

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "rollout", label: "Rollout" },
  { value: "disabled", label: "Disabled" },
  { value: "archived", label: "Archived" },
];

const headerClass =
  "text-muted-foreground h-8 px-3 text-[10px] font-medium tracking-[0.1em] uppercase";
const cellClass = "px-3 py-2.5 text-[12px]";

function statusFor(
  flag: WorkspaceFlagSummary,
  environmentKey: string | null,
): StatusView {
  if (flag.status === "archived") return "archived";

  const environment = flag.environments.find(
    (entry) => entry.environmentKey === environmentKey,
  );

  if (!environment || !environment.enabled) return "disabled";

  return environment.rolloutPercentage >= 100 ? "active" : "rollout";
}

function searchableText(flag: WorkspaceFlagSummary): string {
  return [flag.key, flag.name, flag.owner, flag.description, flag.projectKey]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
}

export function FlagsTable({
  flags,
  projectKey,
  environmentKey,
  environmentName,
  now,
}: {
  flags: WorkspaceFlagSummary[];
  /** The sidebar-selected project; only its flags have a detail route. */
  projectKey: string | null;
  /** The sidebar-selected environment whose rollout each row shows. */
  environmentKey: string | null;
  environmentName: string | null;
  /** Passed in so relative labels stay stable across hydration. */
  now: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const nowDate = useMemo(() => new Date(now), [now]);
  const scopeLabel = environmentName ?? "all environments";

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return flags.filter((flag) => {
      if (status !== "all" && statusFor(flag, environmentKey) !== status) {
        return false;
      }
      if (!needle) return true;

      return searchableText(flag).includes(needle);
    });
  }, [flags, query, status, environmentKey]);

  return (
    <section className="bg-card rounded-lg border">
      <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search flags by name, key, owner or project"
            placeholder="Search flags by name, key or owner…"
            className="h-8 pl-8 text-[13px]"
          />
        </div>

        <span className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px]">
          {scopeLabel}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-[11px]">
              <FilterIcon aria-hidden="true" className="size-3.5" />
              Filters
              {status !== "all" ? (
                <span className="bg-primary text-primary-foreground ml-0.5 rounded-full px-1.5 text-[10px]">
                  1
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={status}
              onValueChange={(value) => setStatus(value as StatusFilter)}
            >
              {statusFilters.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <p className="text-muted-foreground text-[11px] sm:ml-auto">
          {visible.length} of {flags.length} flags in {scopeLabel}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={headerClass}>Flag</TableHead>
            <TableHead className={headerClass}>Status</TableHead>
            <TableHead className={headerClass}>Project</TableHead>
            <TableHead className={headerClass}>Rollout</TableHead>
            <TableHead className={headerClass}>Updated</TableHead>
            <TableHead className={cn(headerClass, "w-10 text-right")}> </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={6}
                className="text-muted-foreground py-10 text-center text-[12px]"
              >
                {flags.length === 0
                  ? "No flags in this workspace yet."
                  : "No flags match your search."}
              </TableCell>
            </TableRow>
          ) : (
            visible.map((flag) => {
              const presentation = statusPresentation[
                statusFor(flag, environmentKey)
              ];
              const environment = flag.environments.find(
                (entry) => entry.environmentKey === environmentKey,
              );
              const subtitle = [flag.name, flag.owner, flag.description]
                .filter((value): value is string => Boolean(value))
                .join(" · ");

              return (
                <TableRow key={`${flag.projectKey}/${flag.key}`}>
                  <TableCell className={cellClass}>
                    {flag.projectKey === projectKey ? (
                      <Link
                        href={`/flags/${flag.key}`}
                        className="hover:text-primary block font-mono text-[12px] font-medium transition-colors"
                      >
                        {flag.key}
                      </Link>
                    ) : (
                      <span
                        title={`Switch to ${flag.projectKey} to open this flag`}
                        className="block font-mono text-[12px] font-medium"
                      >
                        {flag.key}
                      </span>
                    )}
                    <span className="text-muted-foreground block text-[11px]">
                      {subtitle}
                    </span>
                  </TableCell>

                  <TableCell className={cellClass}>
                    <Badge variant={presentation.variant}>
                      {presentation.label}
                    </Badge>
                  </TableCell>

                  <TableCell className={cn(cellClass, "font-mono text-[11px]")}>
                    {flag.projectKey}
                  </TableCell>

                  <TableCell className={cellClass}>
                    {environment ? (
                      <div className="flex w-28 items-center gap-2">
                        <ProgressBar
                          value={environment.rolloutPercentage}
                          label={`${flag.key} rollout`}
                        />
                        <span className="text-muted-foreground w-8 shrink-0 text-right text-[11px]">
                          {environment.rolloutPercentage}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">
                        No environment
                      </span>
                    )}
                  </TableCell>

                  <TableCell className={cn(cellClass, "text-muted-foreground")}>
                    {formatRelativeTime(flag.updatedAt, nowDate)}
                  </TableCell>

                  <TableCell className={cn(cellClass, "text-right")}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${flag.key}`}
                      >
                        <PencilIcon aria-hidden="true" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`More actions for ${flag.key}`}
                          >
                            <MoreHorizontalIcon aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel>{flag.key}</DropdownMenuLabel>
                          <DropdownMenuItem disabled>Edit flag</DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            View history
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </section>
  );
}
