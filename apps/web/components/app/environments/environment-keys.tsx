"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { cn } from "cn";
import { CopyButton } from "@/components/app/copy-button";
import { Button } from "@/components/ui/button";
import type {
  EnvironmentEndpoint,
  ResolvedSdkKey,
} from "@/lib/environment-data";

/**
 * SDK keys and endpoints.
 *
 * A Client Component because revealing and copying a credential need state and
 * clipboard access. Every value it renders comes from the fixtures in
 * `environment-data.ts` — nothing here is a real credential.
 */

/**
 * A masked credential with reveal and copy.
 *
 * The mask is passed in rather than derived here so the list card can show the
 * environment-level mask while the key rows show the fuller one.
 */
export function SdkKeyChip({
  value,
  masked,
  label,
  className,
}: {
  value: string;
  masked: string;
  label: string;
  className?: string;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      className={cn(
        "bg-muted flex min-w-0 items-center gap-2 rounded-md px-2.5 py-1.5",
        className,
      )}
    >
      <span className="truncate font-mono text-[11px]">
        {revealed ? value : masked}
      </span>

      <span className="ml-auto flex shrink-0 items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-pressed={revealed}
          aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
          title={revealed ? "Hide key" : "Show key"}
          onClick={() => setRevealed((current) => !current)}
        >
          {revealed ? (
            <EyeOffIcon aria-hidden="true" />
          ) : (
            <EyeIcon aria-hidden="true" />
          )}
        </Button>
        <CopyButton value={value} label={label} />
      </span>
    </div>
  );
}

/** The keys an SDK uses to authenticate against this environment. */
export function SdkKeysCard({ keys }: { keys: ResolvedSdkKey[] }) {
  return (
    <section className="bg-card rounded-lg border">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="text-[13px] font-medium">SDK keys</h2>
        <Button
          variant="link"
          size="sm"
          disabled
          title="Create key — coming soon"
          className="text-[11px]"
        >
          Create key
        </Button>
      </header>

      <ul className="divide-y px-4">
        {keys.map((key) => (
          <li
            key={key.kind}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="text-[12px] font-medium">{key.label}</p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                Created {key.createdLabel}
              </p>
            </div>

            <div className="w-full min-w-0 sm:w-auto sm:min-w-[15rem]">
              <SdkKeyChip
                value={key.value}
                masked={key.masked}
                label={key.label.toLowerCase()}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Per-environment URLs an SDK points at. */
export function EndpointsCard({
  endpoints,
}: {
  endpoints: EnvironmentEndpoint[];
}) {
  return (
    <section className="bg-card rounded-lg border">
      <header className="border-b px-4 py-3">
        <h2 className="text-[13px] font-medium">Endpoints</h2>
      </header>

      <ul className="divide-y px-4">
        {endpoints.map((endpoint) => (
          <li
            key={endpoint.label}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="text-[12px] font-medium">{endpoint.label}</p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                {endpoint.description}
              </p>
            </div>

            <div className="flex min-w-0 items-center gap-1">
              <span className="text-muted-foreground truncate font-mono text-[11px]">
                {endpoint.url}
              </span>
              <CopyButton value={endpoint.url} label={endpoint.label} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
