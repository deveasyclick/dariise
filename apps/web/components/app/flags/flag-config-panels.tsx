import { AlertTriangleIcon, UserIcon } from "lucide-react";
import { SdkPreview, sdkSnippet } from "@/components/app/flags/sdk-preview";
import { Button } from "@/components/ui/button";
import type { FlagDetailView } from "@/lib/flag-detail-data";

/**
 * Read-only panels for the Configuration tab.
 *
 * Deliberately free of `"use client"` so they stay Server Components; the
 * interactive controls live in `flag-configuration.tsx` and receive these as
 * children.
 */

export function FlagMetadata({ flag }: { flag: FlagDetailView }) {
  const rows: Array<[string, React.ReactNode]> = [
    ["Key", <span key="key" className="font-mono">{flag.key}</span>],
    ["Type", flag.type.charAt(0).toUpperCase() + flag.type.slice(1)],
    ["Created", flag.createdLabel],
    ["Last modified", flag.updatedLabel],
    ["Owner", flag.owner],
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

      <div className="text-muted-foreground mt-3 flex items-center gap-1.5 border-t pt-3 text-[11px]">
        <UserIcon aria-hidden="true" className="size-3" />
        Last changed by {flag.owner}
      </div>
    </section>
  );
}

export function FlagVariations({ flag }: { flag: FlagDetailView }) {
  return (
    <section className="bg-card rounded-lg border p-4">
      <h2 className="text-[13px] font-medium">Variations</h2>
      <p className="text-muted-foreground mt-1 text-[11px]">
        The values this flag can serve.
      </p>

      <ul className="mt-3 divide-y">
        {flag.variations.map((variation) => (
          <li
            key={variation.name}
            className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-[12px] font-medium">{variation.name}</p>
              <p className="text-muted-foreground font-mono text-[11px]">
                {variation.value}
              </p>
            </div>
            <p className="text-muted-foreground max-w-[18rem] text-right text-[11px]">
              {variation.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FlagFallback({ flag }: { flag: FlagDetailView }) {
  return (
    <section className="bg-card rounded-lg border p-4">
      <h2 className="text-[13px] font-medium">Evaluation Fallback</h2>
      <p className="text-muted-foreground mt-1 text-[11px]">
        Used when the SDK cannot reach Dariise.
      </p>
      <div className="mt-3">
        <SdkPreview
          title="Fallback"
          language=""
          lines={sdkSnippet({
            flagKey: flag.key,
            fallback: flag.fallbackVariant.toLowerCase(),
          })}
        />
      </div>
    </section>
  );
}

export function FlagArchiveAction() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[12px] font-medium">Archive flag</p>
        <p className="text-muted-foreground mt-0.5 text-[11px]">
          Archiving removes the flag from all SDKs immediately.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled
        title="Archive — coming soon"
        className="border-danger-ink/40 text-danger-ink gap-1.5 text-[11px]"
      >
        <AlertTriangleIcon aria-hidden="true" className="size-3.5" />
        Archive Flag
      </Button>
    </div>
  );
}

/** Static danger-zone shell; the action comes from `FlagArchiveAction`. */
export function DangerZoneCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="border-danger-ink/30 bg-danger-ink/5 rounded-lg border p-4">
      <h2 className="text-danger-ink text-[13px] font-medium">Danger zone</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
