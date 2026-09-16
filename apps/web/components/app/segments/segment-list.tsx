"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MoreHorizontalIcon,
  PencilIcon,
  SearchIcon,
} from "lucide-react";
import { cn } from "cn";
import { SegmentGlyph } from "@/components/app/segments/segment-glyph";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import type { SegmentSummary } from "@/lib/segment-data";

const headerClass =
  "text-muted-foreground h-8 px-3 text-[10px] font-medium tracking-[0.1em] uppercase";
const cellClass = "px-3 py-2.5 text-[12px]";

export function SegmentList({ segments }: { segments: SegmentSummary[] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return segments;

    return segments.filter((segment) =>
      [segment.name, segment.description, segment.key, segment.ruleSummary]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [segments, query]);

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
            aria-label="Search segments"
            placeholder="Search segments…"
            className="h-8 pl-8 text-[13px]"
          />
        </div>

        <p className="text-muted-foreground text-[11px] sm:ml-auto">
          {visible.length} of {segments.length} segments
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={headerClass}>Segment</TableHead>
            <TableHead className={cn(headerClass, "text-right")}>Members</TableHead>
            <TableHead className={cn(headerClass, "text-right")}>Flags</TableHead>
            <TableHead className={headerClass}>Rule summary</TableHead>
            <TableHead className={headerClass}>Updated</TableHead>
            <TableHead className={cn(headerClass, "w-16 text-right")}> </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={6}
                className="text-muted-foreground py-10 text-center text-[12px]"
              >
                No segments match your search.
              </TableCell>
            </TableRow>
          ) : (
            visible.map((segment) => (
              <TableRow key={segment.key}>
                <TableCell className={cellClass}>
                  <div className="flex items-start gap-2.5">
                    <SegmentGlyph segmentKey={segment.key} />
                    <div className="min-w-0">
                      <Link
                        href={`/segments/${segment.key}`}
                        className="hover:text-primary block text-[12px] font-medium transition-colors"
                      >
                        {segment.name}
                      </Link>
                      <span className="text-muted-foreground block text-[11px]">
                        {segment.description}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className={cn(cellClass, "text-right font-medium")}>
                  {segment.memberCount.toLocaleString("en-GB")}
                </TableCell>

                <TableCell className={cn(cellClass, "text-right")}>
                  {segment.flags.length}
                </TableCell>

                <TableCell
                  className={cn(cellClass, "text-muted-foreground max-w-72")}
                >
                  <span className="block truncate font-mono text-[11px]">
                    {segment.ruleSummary}
                  </span>
                </TableCell>

                <TableCell className={cn(cellClass, "text-muted-foreground")}>
                  {segment.updatedLabel}
                </TableCell>

                <TableCell className={cn(cellClass, "text-right")}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${segment.name}`}
                      title="Edit — coming soon"
                      disabled
                    >
                      <PencilIcon aria-hidden="true" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`More actions for ${segment.name}`}
                        >
                          <MoreHorizontalIcon aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel>{segment.name}</DropdownMenuLabel>
                        <DropdownMenuItem disabled>Edit segment</DropdownMenuItem>
                        <DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem disabled>Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}
