import { FlagIcon } from "lucide-react";
import { cn } from "cn";
import { CoverageStatePill } from "@/components/app/environments/coverage-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  EnvironmentView,
  FlagCoverageState,
  ResolvedCoverageRow,
} from "@/lib/environment-data";

/**
 * Flag coverage tables.
 *
 * Read-only, so both the cross-environment matrix on the list screen and the
 * single-environment table on the Coverage tab stay Server Components. The
 * state pill itself lives in `coverage-pill.tsx`; re-exported here so server
 * callers have one import for the whole feature.
 */

const headerClass =
  "text-muted-foreground h-8 px-3 text-[10px] font-medium tracking-[0.1em] uppercase";
const cellClass = "px-3 py-2.5 text-[12px]";

export { CoverageStatePill };

/** A missing entry reads as off — a flag that is not listed is not enabled. */
function stateFor(
  row: ResolvedCoverageRow,
  environmentKey: string,
): FlagCoverageState {
  return row.states[environmentKey] ?? { kind: "off" };
}

function FlagCell({ flagKey }: { flagKey: string }) {
  return (
    <span className="flex items-center gap-2">
      <FlagIcon aria-hidden="true" className="text-muted-foreground size-3.5" />
      <span className="font-mono text-[12px]">{flagKey}</span>
    </span>
  );
}

/** The cross-environment matrix on the Environments screen. */
export function FlagCoverageCard({
  environments,
  rows,
}: {
  environments: Array<Pick<EnvironmentView, "key" | "name">>;
  rows: ResolvedCoverageRow[];
}) {
  return (
    <section className="bg-card mt-3 rounded-lg border">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="text-[13px] font-medium">Flag coverage</h2>
        <span className="text-muted-foreground text-[11px]">
          Effective state per environment
        </span>
      </header>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={headerClass}>Flag</TableHead>
            {environments.map((environment) => (
              <TableHead key={environment.key} className={headerClass}>
                {environment.name}
              </TableHead>
            ))}
            <TableHead className={cn(headerClass, "text-right")}>
              Last changed
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={environments.length + 2}
                className="text-muted-foreground py-10 text-center text-[12px]"
              >
                No flags yet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className={cellClass}>
                  <FlagCell flagKey={row.key} />
                </TableCell>

                {environments.map((environment) => (
                  <TableCell key={environment.key} className={cellClass}>
                    <CoverageStatePill state={stateFor(row, environment.key)} />
                  </TableCell>
                ))}

                <TableCell
                  className={cn(cellClass, "text-muted-foreground text-right")}
                >
                  {row.changedLabel}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}

/** One environment's flags, shown on the Coverage tab. */
export function EnvironmentCoverageCard({
  environment,
  rows,
}: {
  environment: EnvironmentView;
  rows: ResolvedCoverageRow[];
}) {
  return (
    <section className="bg-card rounded-lg border">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="text-[13px] font-medium">Flag coverage</h2>
          <p className="text-muted-foreground mt-0.5 text-[11px]">
            The flags whose state is worth comparing in {environment.name}.
          </p>
        </div>
        <span className="text-muted-foreground text-[11px]">
          {environment.counts.on} on · {environment.counts.off} off ·{" "}
          {environment.counts.scheduled} scheduled
        </span>
      </header>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={headerClass}>Flag</TableHead>
            <TableHead className={headerClass}>Effective state</TableHead>
            <TableHead className={cn(headerClass, "text-right")}>
              Last changed
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={3}
                className="text-muted-foreground py-10 text-center text-[12px]"
              >
                No flags yet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className={cellClass}>
                  <FlagCell flagKey={row.key} />
                </TableCell>
                <TableCell className={cellClass}>
                  <CoverageStatePill state={stateFor(row, environment.key)} />
                </TableCell>
                <TableCell
                  className={cn(cellClass, "text-muted-foreground text-right")}
                >
                  {row.changedLabel}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}
