import Link from "next/link";
import { LayersIcon } from "lucide-react";
import { cn } from "cn";
import { SegmentGlyph } from "@/components/app/segments/segment-glyph";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SegmentFlagRef, SegmentView } from "@/lib/segment-data";

const headerClass =
  "text-muted-foreground h-8 px-3 text-[10px] font-medium tracking-[0.1em] uppercase";
const cellClass = "px-3 py-2.5 text-[12px]";

/** Environment and status chips shared by "Used by flags" and the Flags tab. */
export function FlagStatusCells({ flag }: { flag: SegmentFlagRef }) {
  return (
    <>
      <span className="bg-muted text-muted-foreground inline-flex rounded-md px-2 py-0.5 text-[10px] capitalize">
        {flag.environment}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px]",
          flag.isRollout
            ? "bg-warn-ink/10 text-warn-ink"
            : "bg-ok-ink/10 text-ok-ink",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            flag.isRollout ? "bg-warn-ink" : "bg-ok-ink",
          )}
        />
        {flag.status}
      </span>
    </>
  );
}

/** Definition tab — the segment's rules as a read-only table. */
export function SegmentRuleTable({ segment }: { segment: SegmentView }) {
  return (
    <section className="bg-card rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[13px] font-medium">Segment rules</h2>
        <Link
          href="/segments/new"
          className="text-primary text-[11px] font-medium hover:underline"
        >
          Edit rules
        </Link>
      </div>

      {segment.rules.length === 0 ? (
        <p className="text-muted-foreground mt-4 rounded-lg border border-dashed p-4 text-[12px]">
          This segment has no rules.
        </p>
      ) : (
        <Table className="mt-3">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={headerClass}>Attribute</TableHead>
              <TableHead className={headerClass}>Operator</TableHead>
              <TableHead className={headerClass}>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {segment.rules.map((rule) => (
              <TableRow key={rule.id} className="hover:bg-transparent">
                <TableCell className={cn(cellClass, "font-mono text-[11px]")}>
                  {rule.attribute}
                </TableCell>
                <TableCell className={cn(cellClass, "text-muted-foreground")}>
                  {rule.operator}
                </TableCell>
                <TableCell className={cn(cellClass, "font-mono text-[11px]")}>
                  {rule.values.length > 0 ? rule.values.join(", ") : "any"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

/** Definition tab — the flags that reference this segment. */
export function SegmentUsedByFlags({ segment }: { segment: SegmentView }) {
  return (
    <section className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-medium">Used by flags</h2>
        <span className="text-muted-foreground text-[11px]">
          {segment.flags.length} flag{segment.flags.length === 1 ? "" : "s"}
        </span>
      </div>

      {segment.flags.length === 0 ? (
        <p className="text-muted-foreground mt-3 rounded-lg border border-dashed p-4 text-[12px]">
          No flags reference this segment yet.
        </p>
      ) : (
        <ul className="mt-3 divide-y">
          {segment.flags.map((flag) => (
            <li
              key={`${flag.key}-${flag.environment}`}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <SegmentGlyph segmentKey={flag.key} className="size-6" />
              <Link
                href={`/flags/${flag.key}`}
                className="hover:text-primary flex-1 font-mono text-[12px] transition-colors"
              >
                {flag.key}
              </Link>
              <FlagStatusCells flag={flag} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Members tab — every sample user that satisfies the rules. */
export function SegmentMembers({ segment }: { segment: SegmentView }) {
  return (
    <section className="bg-card rounded-lg border">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="text-[13px] font-medium">Members</h2>
          <p className="text-muted-foreground mt-0.5 text-[11px]">
            Sample users currently matching this segment.
          </p>
        </div>
        <span className="text-muted-foreground text-[11px]">
          {segment.memberCount} member{segment.memberCount === 1 ? "" : "s"}
        </span>
      </header>

      {segment.members.length === 0 ? (
        <p className="text-muted-foreground p-4 text-[12px]">
          No sample users match this segment.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={headerClass}>User</TableHead>
              <TableHead className={headerClass}>Plan</TableHead>
              <TableHead className={headerClass}>Region</TableHead>
              <TableHead className={cn(headerClass, "text-right")}>
                Sessions
              </TableHead>
              <TableHead className={cn(headerClass, "text-right")}>Beta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {segment.members.map((user) => (
              <TableRow key={user.id}>
                <TableCell className={cellClass}>
                  <span className="block font-mono text-[11px]">{user.id}</span>
                  <span className="text-muted-foreground block text-[11px]">
                    {user.email}
                  </span>
                </TableCell>
                <TableCell className={cellClass}>{user.plan}</TableCell>
                <TableCell className={cellClass}>{user.region}</TableCell>
                <TableCell className={cn(cellClass, "text-right")}>
                  {user.sessions}
                </TableCell>
                <TableCell className={cn(cellClass, "text-right")}>
                  {user.beta ? (
                    <Badge variant="ok">true</Badge>
                  ) : (
                    <Badge variant="outline">false</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

/** Flags tab — a fuller view of the referencing flags. */
export function SegmentFlags({ segment }: { segment: SegmentView }) {
  return (
    <section className="bg-card rounded-lg border">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="text-[13px] font-medium">Flags using this segment</h2>
          <p className="text-muted-foreground mt-0.5 text-[11px]">
            Disabling the segment changes how these flags evaluate.
          </p>
        </div>
      </header>

      {segment.flags.length === 0 ? (
        <p className="text-muted-foreground p-4 text-[12px]">
          No flags reference this segment yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={headerClass}>Flag</TableHead>
              <TableHead className={headerClass}>Environment</TableHead>
              <TableHead className={headerClass}>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {segment.flags.map((flag) => (
              <TableRow key={`${flag.key}-${flag.environment}`}>
                <TableCell className={cellClass}>
                  <Link
                    href={`/flags/${flag.key}`}
                    className="hover:text-primary inline-flex items-center gap-2 font-mono text-[12px] transition-colors"
                  >
                    <LayersIcon
                      aria-hidden="true"
                      className="text-muted-foreground size-3.5"
                    />
                    {flag.key}
                  </Link>
                </TableCell>
                <TableCell className={cn(cellClass, "capitalize")}>
                  {flag.environment}
                </TableCell>
                <TableCell className={cellClass}>
                  <span className="inline-flex gap-2">
                    <FlagStatusCells flag={flag} />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
