"use client";

import { useRef, useState } from "react";
import {
  CheckCheckIcon,
  HistoryIcon,
  LoaderCircleIcon,
  SaveIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { FlagDetailView } from "@/lib/flag-detail-data";
import { publishFlagChanges } from "@/lib/flag-stub";

/**
 * Configuration tab.
 *
 * Only the interactive column lives here. The read-only panels (metadata,
 * variations, danger zone) are passed in from the server page as children and
 * stay Server Components.
 */
export function FlagConfiguration({
  flag,
  metadata,
  variations,
  dangerZone,
}: {
  flag: FlagDetailView;
  metadata: React.ReactNode;
  variations: React.ReactNode;
  dangerZone: React.ReactNode;
}) {
  const [enabled, setEnabled] = useState(flag.enabled);
  const [serving, setServing] = useState(
    flag.enabled ? flag.defaultVariation : flag.offVariation,
  );
  const [percentage, setPercentage] = useState(flag.rolloutPercentage);
  const [pending, setPending] = useState(false);
  const [published, setPublished] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const environmentLabel =
    flag.environment.charAt(0).toUpperCase() + flag.environment.slice(1);

  async function handlePublish() {
    if (pending) return;
    setPending(true);
    setPublished(null);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await publishFlagChanges(
        {
          key: flag.key,
          enabled,
          defaultVariation: serving,
          rolloutPercentage: percentage,
          rules: flag.rules,
        },
        controller.signal,
      );
      // A local acknowledgement only — nothing is persisted.
      setPublished("just now");
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") setPublished(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)]">
      <div className="space-y-4">
        <section className="bg-card rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[13px] font-medium capitalize">
                {environmentLabel}
              </h2>
              <p className="text-muted-foreground mt-1 text-[11px]">
                Serve this flag in {environmentLabel.toLowerCase()}.
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              aria-label={`Serve ${flag.key} in ${environmentLabel}`}
            />
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="flag-serving">Serving behaviour</Label>
            <Select value={serving} onValueChange={setServing}>
              <SelectTrigger
                id="flag-serving"
                className="h-8 w-full text-[12px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {flag.variations.map((variation) => (
                  <SelectItem key={variation.name} value={variation.name}>
                    {variation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-[11px]">
              Evaluated for every user who does not match a targeting rule.
            </p>
          </div>
        </section>

        <section className="bg-card rounded-lg border p-4">
          <h2 className="text-[13px] font-medium">Percentage Rollout</h2>
          <p className="text-muted-foreground mt-1 text-[11px]">
            Gradually release this variation to a share of users.
          </p>

          <div className="mt-5">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={percentage}
              aria-label={`${flag.key} rollout percentage`}
              onChange={(event) => setPercentage(Number(event.target.value))}
              className="accent-primary bg-muted h-1.5 w-full cursor-pointer rounded-full"
            />
            <div className="text-muted-foreground mt-1 flex items-center justify-between text-[10px]">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="bg-muted/50 mt-4 rounded-lg border p-3">
            <div className="flex items-end justify-between gap-4">
              <p className="text-[28px] leading-none font-semibold tracking-tight">
                {percentage}%
              </p>
              <p className="text-muted-foreground text-right text-[11px]">
                of users in {environmentLabel} will receive &quot;{serving}&quot;
              </p>
            </div>
            <div className="text-muted-foreground mt-3 flex items-center justify-between gap-4 text-[11px]">
              <span>
                {percentage === 0
                  ? "Off — nobody receives this variation"
                  : "Deterministic bucketing keeps each user's result stable"}
              </span>
              <span className="font-mono">bucket-by: {flag.bucketBy}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            {published ? (
              <span className="text-ok-ink inline-flex items-center gap-1.5 text-[11px]">
                <CheckCheckIcon aria-hidden="true" className="size-3.5" />
                Last published {published}
              </span>
            ) : (
              <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px]">
                <HistoryIcon aria-hidden="true" className="size-3.5" />
                Last published {flag.updatedLabel}
              </span>
            )}

            <Button
              size="sm"
              className="gap-1.5 text-[11px]"
              disabled={pending}
              onClick={handlePublish}
            >
              {pending ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <SaveIcon aria-hidden="true" className="size-3.5" />
              )}
              {pending ? "Publishing…" : "Publish changes"}
            </Button>
          </div>
        </section>

        {variations}
      </div>

      <div className="space-y-4">
        {metadata}
        {dangerZone}
      </div>
    </div>
  );
}
