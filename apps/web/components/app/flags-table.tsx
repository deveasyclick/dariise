"use client";

import { useMemo, useState } from "react";
import {
  FilterIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SearchIcon,
} from "lucide-react";
import { cn } from "cn";
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
import type { DashboardFlag } from "@/lib/dashboard-data";
import { hoursAgo, formatRelativeTime } from "@/lib/format";

type StatusFilter = "all" | DashboardFlag["status"];

const statusPresentation: Record<
  DashboardFlag["status"],
  { label: string; variant: "ok" | "warn" | "outline" }
> = {
  active: { label: "Active", variant: "ok" },
  rollout: { label: "Rollout", variant: "warn" },
  disabled: { label: "Disabled", variant: "outline" },
};

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "rollout", label: "Rollout" },
  { value: "disabled", label: "Disabled" },
];

const headerClass =
  "text-muted-foreground h-8 px-3 text-[10px] font-medium tracking-[0.1em] uppercase";
const cellClass = "px-3 py-2.5 text-[12px]";

export function FlagsTable({
  flags,
  environmentLabel,
  now,
}: {
  flags: DashboardFlag[];
  environmentLabel: string;
  /** Passed in so relative labels stay stable across hydration. */
  now: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const nowDate = useMemo(() => new Date(now), [now]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return flags.filter((flag) => {
      if (status !== "all" && flag.status !== status) return false;
      if (!needle) return true;

      return [flag.key, flag.name, flag.owner, flag.description]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [flags, query, status]);

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
            aria-label="Search flags by name, key or owner"
            placeholder="Search flags by name, key or owner…"
            className="h-8 pl-8 text-[13px]"
          />
        </div>

        <span className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px]">
          {environmentLabel}
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
          {visible.length} of {flags.length} flags in {environmentLabel}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={headerClass}>Flag</TableHead>
            <TableHead className={headerClass}>Status</TableHead>
            <TableHead className={headerClass}>Environment</TableHead>
            <TableHead className={headerClass}>Rollout</TableHead>
            <TableHead className={headerClass}>Updated</TableHead>
            <TableHead className={headerClass}>Change</TableHead>
            <TableHead className={cn(headerClass, "w-10 text-right")}> </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={7}
                className="text-muted-foreground py-10 text-center text-[12px]"
              >
                No flags match your search.
              </TableCell>
            </TableRow>
          ) : (
            visible.map((flag) => {
              const presentation = statusPresentation[flag.status];

              return (
                <TableRow key={flag.key}>
                  <TableCell className={cellClass}>
                    <span className="block font-mono text-[12px] font-medium">
                      {flag.key}
                    </span>
                    <span className="text-muted-foreground block text-[11px]">
                      {flag.owner} · {flag.description}
                    </span>
                  </TableCell>

                  <TableCell className={cellClass}>
                    <Badge variant={presentation.variant}>
                      {presentation.label}
                    </Badge>
                  </TableCell>

                  <TableCell className={cn(cellClass, "capitalize")}>
                    {flag.environment}
                  </TableCell>

                  <TableCell className={cellClass}>
                    <div className="flex w-28 items-center gap-2">
                      <ProgressBar
                        value={flag.rolloutPercentage}
                        label={`${flag.key} rollout`}
                      />
                      <span className="text-muted-foreground w-8 shrink-0 text-right text-[11px]">
                        {flag.rolloutPercentage}%
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className={cn(cellClass, "text-muted-foreground")}>
                    {formatRelativeTime(
                      hoursAgo(flag.updatedHoursAgo, nowDate),
                      nowDate,
                    )}
                  </TableCell>

                  <TableCell className={cellClass}>
                    <span className="block">{flag.changeOwner}</span>
                    <span className="text-muted-foreground block text-[11px]">
                      {flag.changeNote}
                    </span>
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
