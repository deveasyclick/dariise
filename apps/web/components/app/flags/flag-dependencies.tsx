import { CheckCircle2Icon, GitBranchIcon, LayersIcon } from "lucide-react";
import { cn } from "cn";
import type { FlagDetailView } from "@/lib/flag-detail-data";

function GraphNode({
  flagKey,
  meta,
  tone,
  chip,
}: {
  flagKey: string;
  meta: string;
  tone: "upstream" | "self" | "downstream";
  chip?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card flex min-w-40 flex-col rounded-lg border px-3 py-2",
        tone === "self" && "border-primary/40 bg-primary/5",
      )}
    >
      <span className="flex items-center gap-1.5">
        <LayersIcon
          aria-hidden="true"
          className="text-muted-foreground size-3"
        />
        <span className="font-mono text-[11px] font-medium">{flagKey}</span>
      </span>
      <span className="text-muted-foreground mt-0.5 text-[10px]">{meta}</span>
      {chip ? (
        <span className="text-ok-ink mt-1 inline-flex items-center gap-1 text-[10px]">
          <span aria-hidden="true" className="bg-ok-ink size-1.5 rounded-full" />
          {chip}
        </span>
      ) : null}
    </div>
  );
}

function GraphLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground text-center text-[10px] tracking-[0.14em] uppercase">
      {children}
    </p>
  );
}

function Connector() {
  return (
    <span
      aria-hidden="true"
      className="border-border mx-auto h-5 w-px border-l"
    />
  );
}

const legend = [
  { label: "Upstream", tone: "upstream" as const },
  { label: "This flag", tone: "self" as const },
  { label: "Downstream", tone: "downstream" as const },
];

/**
 * Dependencies tab.
 *
 * Read-only, so it stays a Server Component. The graph is laid out with flex
 * and border rules rather than a graph library: the diagram is a static
 * three-tier tree, and a dependency would not be justified.
 */
export function FlagDependencies({ flag }: { flag: FlagDetailView }) {
  const { dependencies } = flag;
  const environmentLabel =
    flag.environment.charAt(0).toUpperCase() + flag.environment.slice(1);
  const hasAny =
    dependencies.upstream.length > 0 || dependencies.downstream.length > 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)]">
      <div className="space-y-4">
        <section className="bg-card rounded-lg border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-medium">Dependency Graph</h2>
              <p className="text-muted-foreground mt-1 text-[11px]">
                {flag.key} · {environmentLabel}
              </p>
            </div>

            <ul className="flex items-center gap-3">
              {legend.map((item) => (
                <li
                  key={item.label}
                  className="text-muted-foreground flex items-center gap-1.5 text-[10px]"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 rounded-full",
                      item.tone === "upstream" && "bg-slate-ink",
                      item.tone === "self" && "bg-primary",
                      item.tone === "downstream" && "bg-purple-ink",
                    )}
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          {hasAny ? (
            <div className="mt-5">
              {dependencies.upstream.length > 0 ? (
                <>
                  <GraphLabel>
                    requires {dependencies.upstream.length}
                  </GraphLabel>
                  <ul className="mt-3 flex flex-wrap justify-center gap-3">
                    {dependencies.upstream.map((dependency) => (
                      <li key={dependency.key}>
                        <GraphNode
                          flagKey={dependency.key}
                          meta={dependency.requires}
                          tone="upstream"
                        />
                      </li>
                    ))}
                  </ul>
                  <div className="mt-1">
                    <Connector />
                  </div>
                </>
              ) : null}

              <div className="flex justify-center">
                <GraphNode
                  flagKey={flag.key}
                  meta={`This flag · ${environmentLabel}`}
                  tone="self"
                  chip={flag.enabled ? "Enabled" : "Disabled"}
                />
              </div>

              {dependencies.downstream.length > 0 ? (
                <>
                  <div className="mt-1">
                    <Connector />
                  </div>
                  <GraphLabel>
                    required by {dependencies.downstream.length}
                  </GraphLabel>
                  <ul className="mt-3 flex flex-wrap justify-center gap-3">
                    {dependencies.downstream.map((dependency) => (
                      <li key={dependency.key}>
                        <GraphNode
                          flagKey={dependency.key}
                          meta={dependency.requires}
                          tone="downstream"
                        />
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ) : (
            <p className="text-muted-foreground mt-4 rounded-lg border border-dashed p-4 text-[12px]">
              This flag has no dependencies in either direction.
            </p>
          )}
        </section>

        <section className="bg-card rounded-lg border p-4">
          <h2 className="text-[13px] font-medium">Dependency Rules</h2>
          <p className="text-muted-foreground mt-1 text-[11px]">
            What each relationship requires at evaluation time.
          </p>

          {hasAny ? (
            <ul className="mt-3 divide-y">
              {dependencies.upstream.map((dependency) => (
                <li
                  key={dependency.key}
                  className="flex items-start gap-3 py-3 first:pt-0"
                >
                  <CheckCircle2Icon
                    aria-hidden="true"
                    className="text-ok-ink mt-0.5 size-3.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[12px]">{dependency.key}</p>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                      Must be {dependency.requires.toLowerCase()} before{" "}
                      {flag.key} evaluates. Referenced in {dependency.referencedIn}.
                    </p>
                  </div>
                  <span className="bg-ok-ink/10 text-ok-ink shrink-0 rounded-md px-2 py-0.5 text-[10px]">
                    satisfied
                  </span>
                </li>
              ))}

              {dependencies.downstream.map((dependency) => (
                <li
                  key={dependency.key}
                  className="flex items-start gap-3 py-3 last:pb-0"
                >
                  <GitBranchIcon
                    aria-hidden="true"
                    className="text-warn-ink mt-0.5 size-3.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[12px]">{dependency.key}</p>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                      Disabling {flag.key} cascades to this flag. Referenced in{" "}
                      {dependency.referencedIn}.
                    </p>
                  </div>
                  <span className="bg-warn-ink/10 text-warn-ink shrink-0 rounded-md px-2 py-0.5 text-[10px]">
                    cascades
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground mt-3 rounded-lg border border-dashed p-4 text-[12px]">
              No dependency rules to evaluate.
            </p>
          )}
        </section>
      </div>

      <div className="space-y-4">
        <section className="bg-card rounded-lg border p-4">
          <h2 className="text-[13px] font-medium">Dependency Summary</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            {[
              ["Upstream", dependencies.summary.upstream],
              ["Downstream", dependencies.summary.downstream],
              ["Circular", dependencies.summary.circular],
              ["Max depth", dependencies.summary.maxDepth],
            ].map(([label, value]) => (
              <div key={label} className="bg-muted/50 rounded-lg border p-3">
                <dt className="text-muted-foreground text-[11px]">{label}</dt>
                <dd className="mt-1 text-xl font-semibold tracking-tight">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {dependencies.summary.circular === 0 ? (
            <p className="text-ok-ink mt-3 inline-flex items-center gap-1.5 text-[11px]">
              <CheckCircle2Icon aria-hidden="true" className="size-3.5" />
              No circular dependencies
            </p>
          ) : (
            <p className="text-danger-ink mt-3 text-[11px]">
              {dependencies.summary.circular} circular dependencies detected.
            </p>
          )}
        </section>

        <section className="bg-card rounded-lg border p-4">
          <h2 className="text-[13px] font-medium">Evaluation Order</h2>
          <p className="text-muted-foreground mt-1 text-[11px]">
            Flags are resolved top to bottom before {flag.key} is evaluated.
          </p>

          <ol className="mt-3 divide-y">
            {dependencies.evaluationOrder.map((entry, index) => (
              <li
                key={entry.key}
                className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
              >
                <span className="text-muted-foreground w-4 text-right text-[11px]">
                  {index + 1}
                </span>
                <span
                  className={cn(
                    "flex-1 font-mono text-[12px]",
                    entry.isSelf && "font-medium",
                  )}
                >
                  {entry.key}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[10px]",
                    entry.isSelf ? "text-primary" : "text-ok-ink",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 rounded-full",
                      entry.isSelf ? "bg-primary" : "bg-ok-ink",
                    )}
                  />
                  {entry.status}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
