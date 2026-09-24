"use client";

import { useRef, useState } from "react";
import {
  CheckCheckIcon,
  HistoryIcon,
  LoaderCircleIcon,
  SaveIcon,
} from "lucide-react";
import type { FlagEnvironmentConfig } from "@dariise/contracts";
import { FieldError } from "@/components/auth/field";
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
import { ApiError, flags as flagsApi } from "@/lib/api";

/**
 * Configuration tab.
 *
 * Only the interactive column lives here. The read-only panels (metadata,
 * variations, danger zone) are passed in from the server page as children and
 * stay Server Components.
 */
export function FlagConfiguration({
  projectKey,
  flagKey,
  config,
  updatedLabel,
  metadata,
  variations,
  dangerZone,
}: {
  projectKey: string;
  flagKey: string;
  config: FlagEnvironmentConfig;
  updatedLabel: string;
  metadata: React.ReactNode;
  variations: React.ReactNode;
  dangerZone: React.ReactNode;
}) {
  const [enabled, setEnabled] = useState(config.enabled);
  const [serving, setServing] = useState(config.defaultVariation);
  const [percentage, setPercentage] = useState(config.rolloutPercentage);
  const [pending, setPending] = useState(false);
  const [published, setPublished] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const environmentLabel = config.environmentName;

  async function handlePublish() {
    if (pending) return;
    setPending(true);
    setPublished(null);
    setError(null);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const updated = await flagsApi.updateEnvironmentConfig(
        projectKey,
        flagKey,
        config.environmentKey,
        {
          enabled,
          offVariation: config.offVariation,
          defaultVariation: serving,
          rolloutPercentage: percentage,
          bucketBy: config.bucketBy,
          variations: config.variations,
        },
        { signal: controller.signal },
      );

      setEnabled(updated.enabled);
      setServing(updated.defaultVariation);
      setPercentage(updated.rolloutPercentage);
      setPublished("just now");
    } catch (publishError) {
      if ((publishError as Error)?.name === "AbortError") return;

      setError(
        publishError instanceof ApiError
          ? publishError.message
          : "Something went wrong. Please try again.",
      );
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
              aria-label={`Serve ${flagKey} in ${environmentLabel}`}
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
                {config.variations.map((variation) => (
                  <SelectItem key={variation.key} value={variation.key}>
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
              aria-label={`${flagKey} rollout percentage`}
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
              <span className="font-mono">bucket-by: {config.bucketBy}</span>
            </div>
          </div>

          {error ? <FieldError>{error}</FieldError> : null}

          <div className="mt-4 flex items-center justify-between gap-3">
            {published ? (
              <span className="text-ok-ink inline-flex items-center gap-1.5 text-[11px]">
                <CheckCheckIcon aria-hidden="true" className="size-3.5" />
                Last published {published}
              </span>
            ) : (
              <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px]">
                <HistoryIcon aria-hidden="true" className="size-3.5" />
                Last published {updatedLabel}
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
