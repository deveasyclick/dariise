import Link from "next/link";
import {
  ArrowRightIcon,
  GlobeIcon,
  KeyRoundIcon,
  LockIcon,
  RadioIcon,
  ShieldCheckIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { HealthBadge } from "@/components/app/health-badge";
import { EnvironmentMenu } from "@/components/app/environments/environment-menu";
import {
  environmentColorSwatch,
  environmentColors,
} from "@/components/app/environments/environment-colors";
import { SdkKeyChip } from "@/components/app/environments/environment-keys";
import { SectionCard } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import type {
  EnvironmentCounts,
  EnvironmentStatus,
  EnvironmentView,
} from "@/lib/environment-data";

/**
 * Read-only environment panels.
 *
 * Deliberately free of `"use client"` so they stay Server Components; the few
 * genuinely interactive pieces (the key chip, the actions menu, the settings
 * switches) are imported client components.
 */

/** Health pill shown on the cards and on the detail header. */
export function EnvironmentStatusBadge({
  status,
}: {
  status: EnvironmentStatus;
}) {
  return <HealthBadge status={status} />;
}

/** Flag totals as three tiles — the unit both the cards and health card use. */
function CountTiles({
  counts,
  dense = false,
}: {
  counts: EnvironmentCounts;
  dense?: boolean;
}) {
  const tiles: Array<{ label: string; value: number; tone: string }> = [
    { label: "On", value: counts.on, tone: "bg-ok-ink/10 text-ok-ink" },
    { label: "Off", value: counts.off, tone: "bg-muted text-foreground" },
    {
      label: "Scheduled",
      value: counts.scheduled,
      tone: "bg-info-ink/10 text-info-ink",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className={cn("rounded-md px-2 text-center", tile.tone)}
        >
          <p
            className={cn(
              "font-semibold",
              dense ? "pt-1.5 text-[14px]" : "pt-2.5 text-[17px] leading-6",
            )}
          >
            {tile.value}
          </p>
          <p className="pb-1.5 text-[10px] opacity-80">{tile.label}</p>
        </div>
      ))}
    </div>
  );
}

/** One environment as summarised on the Environments list. */
export function EnvironmentCard({
  environment,
}: {
  environment: EnvironmentView;
}) {
  const serverKey = environment.sdkKeys.find((key) => key.kind === "server");

  return (
    <article
      className={cn(
        "bg-card flex flex-col rounded-lg border p-4",
        environment.isDefault && "border-primary",
      )}
    >
      <div className="flex items-center gap-2">
        <h2 className="text-[13px] font-medium">{environment.name}</h2>
        <span className="ml-auto flex items-center gap-1">
          <EnvironmentStatusBadge status={environment.status} />
          <EnvironmentMenu name={environment.name} />
        </span>
      </div>

      <div className="mt-3">
        <SdkKeyChip
          value={serverKey?.value ?? environment.maskedKey}
          masked={environment.maskedKey}
          label={`${environment.name} server key`}
        />
      </div>

      <p className="text-muted-foreground mt-3 truncate font-mono text-[11px]">
        {environment.baseUrl}
      </p>

      <div className="mt-3">
        <CountTiles counts={environment.counts} dense />
      </div>

      <Link
        href={`/environments/${environment.key}`}
        className="text-muted-foreground hover:text-foreground mt-4 flex items-center justify-between gap-2 border-t pt-3 text-[12px] transition-colors"
      >
        Manage environment
        <ArrowRightIcon aria-hidden="true" className="size-3.5" />
      </Link>
    </article>
  );
}

/** The environment cards, with the empty state the design does not cover. */
export function EnvironmentGrid({
  environments,
}: {
  environments: EnvironmentView[];
}) {
  if (environments.length === 0) {
    return (
      <section className="bg-card text-muted-foreground rounded-lg border border-dashed p-6 text-[13px]">
        No environments yet. Create one to give your flags an isolated
        configuration.
      </section>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {environments.map((environment) => (
        <EnvironmentCard key={environment.key} environment={environment} />
      ))}
    </div>
  );
}

/** Flag totals plus evaluation latency for one environment. */
export function EnvironmentHealthCard({
  environment,
}: {
  environment: EnvironmentView;
}) {
  return (
    <SectionCard title="Environment health">
      <CountTiles counts={environment.counts} />

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
        <span className="text-muted-foreground text-[11px]">
          Eval latency p50
        </span>
        <span className="text-[11px] font-medium">
          {environment.evalLatencyP50Ms}ms
        </span>
      </div>
    </SectionCard>
  );
}

/** Danger zone. The action is disabled until the API can delete environments. */
export function EnvironmentDangerCard() {
  return (
    <section className="border-danger-ink/30 bg-danger-ink/5 rounded-lg border p-4">
      <h2 className="text-danger-ink text-[13px] font-medium">
        Delete environment
      </h2>
      <p className="text-muted-foreground mt-1 text-[11px]">
        Removes all flags and keys
      </p>

      <div className="mt-3 flex justify-center">
        <Button
          variant="outline"
          size="sm"
          disabled
          title="Delete environment — coming soon"
          className="border-danger-ink/40 text-danger-ink gap-1.5 text-[11px]"
        >
          <Trash2Icon aria-hidden="true" className="size-3.5" />
          Delete
        </Button>
      </div>
    </section>
  );
}

/** Read-only facts about an environment, as shown on the Settings tab. */
export function EnvironmentMetadataCard({
  environment,
}: {
  environment: EnvironmentView;
}) {
  const colorLabel =
    environmentColors.find((option) => option.value === environment.color)
      ?.label ?? environment.color;

  const rows: Array<[string, React.ReactNode]> = [
    ["Key", <span key="key" className="font-mono">{environment.key}</span>],
    [
      "Endpoint",
      <span key="endpoint" className="font-mono">
        {environment.baseUrl}
      </span>,
    ],
    [
      "Colour",
      <span key="colour" className="inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className={cn(
            "size-2.5 rounded-full",
            environmentColorSwatch[environment.color],
          )}
        />
        {colorLabel}
      </span>,
    ],
    ["Created", environment.createdLabel],
    ["Default", environment.isDefault ? "Yes" : "No"],
  ];

  return (
    <section className="bg-card rounded-lg border p-4">
      <h2 className="text-[13px] font-medium">Metadata</h2>
      <dl className="mt-3 divide-y text-[12px]">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const whatYouGet: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    title: "SDK keys",
    description: "Server, client, and mobile keys",
    icon: KeyRoundIcon,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "SDK endpoints",
    description: "Per-environment evaluation URLs",
    icon: GlobeIcon,
    tone: "bg-info-ink/10 text-info-ink",
  },
  {
    title: "Streaming",
    description: "Live updates over SSE",
    icon: RadioIcon,
    tone: "bg-purple-ink/10 text-purple-ink",
  },
  {
    title: "Isolated config",
    description: "Changes never affect other environments",
    icon: LockIcon,
    tone: "bg-ok-ink/10 text-ok-ink",
  },
];

/** Side panel on the create screen listing what a new environment comes with. */
export function WhatYouGetCard() {
  return (
    <section className="bg-card rounded-lg border p-4">
      <h2 className="text-[13px] font-medium">What you get</h2>

      <ul className="mt-3 space-y-3">
        {whatYouGet.map((item) => {
          const Icon = item.icon;

          return (
            <li key={item.title} className="flex items-start gap-2.5">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-md",
                  item.tone,
                )}
              >
                <Icon aria-hidden="true" className="size-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[12px] font-medium">
                  {item.title}
                </span>
                <span className="text-muted-foreground block text-[11px]">
                  {item.description}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Note explaining what marking an environment protected does. */
export function ProtectedEnvironmentsNote() {
  return (
    <aside className="border-info-ink/20 bg-info-ink/5 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <span className="bg-info-ink/10 text-info-ink flex size-6 shrink-0 items-center justify-center rounded-md">
          <ShieldCheckIcon aria-hidden="true" className="size-3.5" />
        </span>
        <h2 className="text-info-ink text-[12px] font-medium">
          Protected environments
        </h2>
      </div>
      <p className="text-muted-foreground mt-2 text-[11px] leading-5">
        Mark an environment as protected to require approval before any flag
        change is published.
      </p>
    </aside>
  );
}
