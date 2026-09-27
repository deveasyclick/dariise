import Link from "next/link";
import { CheckCheckIcon, ChevronLeftIcon } from "lucide-react";
import { cn } from "cn";
import type { FlagDetail } from "@dariise/contracts";
import { EditFlagButton } from "@/components/app/flags/edit-flag-dialog";
import { FlagStatusBadge } from "@/components/app/flags/flag-state-pill";
import { Badge } from "@/components/ui/badge";

const eyebrowClass =
  "text-[10px] font-medium tracking-[0.16em] uppercase text-muted-foreground";

interface CreateFlagHeaderProps {
  /** Steps shown as a progress path, e.g. ["Details", "Preview"]. */
  readonly steps: string[];
  /** Zero-based index of the step currently in view. */
  readonly currentStep: number;
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
            Define a new flag and preview it before it is created.
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
  readonly flag: FlagDetail;
  readonly projectKey: string;
  readonly environmentKey: string;
  readonly environmentLabel: string;
  /** Whether the chosen environment serves the flag. */
  readonly enabled: boolean;
}

/** Identity and status strip shown above the tabs on the flag detail screen. */
export function FlagDetailHeader({
  flag,
  projectKey,
  environmentKey,
  environmentLabel,
  enabled,
}: FlagDetailHeaderProps) {
  return (
    <div className="bg-card mb-4 rounded-lg border p-4">
      <Link
        href={`/environments/${environmentKey}/flags`}
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
              {flag.key}
            </h1>
            <Badge variant="secondary">{flag.name}</Badge>
            <FlagStatusBadge status={flag.status} />
          </div>
          <p className="text-muted-foreground mt-0.5 text-[13px]">
            {flag.description ?? ""}
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
          <EditFlagButton projectKey={projectKey} flag={flag} />
        </div>
      </div>
    </div>
  );
}

export { eyebrowClass };
