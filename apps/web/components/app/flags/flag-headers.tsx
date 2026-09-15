import Link from "next/link";
import { CheckCheckIcon, ChevronLeftIcon, PencilIcon } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const eyebrowClass =
  "text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground";

interface CreateFlagHeaderProps {
  /** Steps shown as a progress path, e.g. ["Details", "Targeting", "Review"]. */
  steps: string[];
  /** Zero-based index of the step currently in view. */
  currentStep: number;
}

/** Tabs of the create flag form, also acting as its step indicator. */
export function CreateFlagHeader({
  steps,
  currentStep,
}: CreateFlagHeaderProps) {
  return (
    <div className="bg-card mb-4 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <span className="bg-ok-ink/10 text-ok-ink flex size-9 shrink-0 items-center justify-center rounded-lg">
          <CheckCheckIcon aria-hidden="true" className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold tracking-tight">
            Create Feature Flag
          </h1>
          <p className="text-muted-foreground mt-0.5 text-[13px]">
            Define a new flag, then configure targeting per environment.
          </p>
        </div>

        <ol className="hidden shrink-0 items-center gap-1 sm:flex">
          {steps.map((step, index) => (
            <li key={step} className="flex items-center gap-1">
              {index > 0 ? (
                <span aria-hidden="true" className="text-muted-foreground px-1 text-xs">
                  ·
                </span>
              ) : null}
              <span
                aria-current={index === currentStep ? "step" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium",
                  index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

interface FlagDetailHeaderProps {
  flagKey: string;
  name: string;
  description: string;
  environmentLabel: string;
  enabled: boolean;
}

/** Identity and status strip shown above the tabs on every flag detail screen. */
export function FlagDetailHeader({
  flagKey,
  name,
  description,
  environmentLabel,
  enabled,
}: FlagDetailHeaderProps) {
  return (
    <div className="bg-card mb-4 rounded-lg border p-4">
      <Link
        href="/flags"
        className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-[12px] transition-colors"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-3.5" />
        Feature Flags
      </Link>

      <div className="flex flex-wrap items-start gap-3">
        <span className="bg-ok-ink/10 text-ok-ink flex size-9 shrink-0 items-center justify-center rounded-lg">
          <CheckCheckIcon aria-hidden="true" className="size-4.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-lg font-semibold tracking-tight">
              {flagKey}
            </h1>
            <Badge variant="secondary">{name}</Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 text-[13px]">
            {description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] capitalize">
            {environmentLabel}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px]",
              enabled
                ? "bg-ok-ink/10 text-ok-ink"
                : "bg-muted text-muted-foreground",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 rounded-full",
                enabled ? "bg-ok-ink" : "bg-muted-foreground",
              )}
            />
            {enabled ? "Enabled" : "Disabled"}
          </span>
          <Button
            size="sm"
            disabled
            title="Edit flag — coming soon"
            className="gap-1.5 text-[11px]"
          >
            <PencilIcon aria-hidden="true" className="size-3.5" />
            Edit Flag
          </Button>
        </div>
      </div>
    </div>
  );
}

export { eyebrowClass };
