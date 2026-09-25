"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CheckIcon,
  LoaderCircleIcon,
  RocketIcon,
  ShieldCheckIcon,
} from "lucide-react";
import type { PromotionTarget } from "@/components/app/flags/flag-queries";
import { FieldError } from "@/components/auth/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApiError, flags as flagsApi } from "@/lib/api";

const copiedParts = [
  "Its identity: key, name, description, tags and owner.",
  "Its configuration: enabled state, off and default variations, rollout percentage and bucket-by attribute.",
  "Its variations, targeting rules and individual targets.",
] as const;

/**
 * Promote one flag into another environment.
 *
 * Promotion copies the flag whole and the two copies diverge immediately, so the
 * confirmation says so before anything is written.
 */
export function FlagPromotion({
  projectKey,
  environmentKey,
  flagKey,
  environmentName,
  targets,
}: {
  projectKey: string;
  environmentKey: string;
  flagKey: string;
  environmentName: string;
  targets: PromotionTarget[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PromotionTarget | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const controllerRef = useRef<AbortController | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);

    if (!next) {
      setSelected(null);
      setError(null);
    }
  }

  async function promote() {
    if (pending || !selected) return;
    setPending(true);
    setError(null);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await flagsApi.promote(
        projectKey,
        environmentKey,
        flagKey,
        { to: selected.key },
        { signal: controller.signal },
      );

      router.push(`/environments/${selected.key}/flags/${flagKey}`);
    } catch (cause) {
      if ((cause as Error)?.name === "AbortError") return;

      setError(
        cause instanceof ApiError
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={targets.length === 0}
          title={
            targets.length === 0
              ? "This project has no other environment to promote into"
              : undefined
          }
          className="gap-1.5 text-[11px]"
        >
          <RocketIcon aria-hidden="true" className="size-3.5" />
          Promote
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selected ? `Copy into ${selected.name}?` : `Promote ${flagKey}`}
          </DialogTitle>
          <DialogDescription>
            {selected
              ? `A copy of ${flagKey} is created in ${selected.name}. ${environmentName} keeps its own.`
              : `Choose the environment to copy this flag into.`}
          </DialogDescription>
        </DialogHeader>

        {selected ? (
          <div className="space-y-3">
            <p className="text-[12px]">Everything goes with it:</p>
            <ul className="space-y-2">
              {copiedParts.map((part) => (
                <li
                  key={part}
                  className="text-muted-foreground flex items-start gap-2 text-[11px] leading-5"
                >
                  <CheckIcon
                    aria-hidden="true"
                    className="text-ok-ink mt-0.5 size-3.5 shrink-0"
                  />
                  {part}
                </li>
              ))}
            </ul>

            <p className="rounded-md border px-3 py-2 text-[11px] leading-5">
              The copy is independent: changing one afterwards never changes the
              other.
            </p>

            {selected.isProtected ? (
              <p className="border-warn-ink/30 bg-warn-ink/5 text-warn-ink flex items-start gap-2 rounded-md border px-3 py-2 text-[11px] leading-5">
                <ShieldCheckIcon
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0"
                />
                {selected.name} is protected, so the promotion is not published
                directly. The API refuses it with approval required.
              </p>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-2">
            {targets.map((target) => (
              <li key={target.key}>
                <button
                  type="button"
                  onClick={() => setSelected(target)}
                  className="hover:border-primary/40 hover:bg-muted/50 flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium">
                      {target.name}
                    </span>
                    <span className="text-muted-foreground block truncate font-mono text-[10px]">
                      {target.key}
                    </span>
                  </span>
                  {target.isProtected ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Protected
                    </Badge>
                  ) : null}
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="text-muted-foreground size-3.5 shrink-0"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}

        {error ? <FieldError>{error}</FieldError> : null}

        <DialogFooter>
          {selected ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              className="text-[11px]"
              onClick={() => {
                setSelected(null);
                setError(null);
              }}
            >
              Back
            </Button>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            className="text-[11px]"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>

          {selected ? (
            <Button
              type="button"
              size="sm"
              disabled={pending}
              className="gap-1.5 text-[11px]"
              onClick={promote}
            >
              {pending ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <RocketIcon aria-hidden="true" className="size-3.5" />
              )}
              {pending ? "Promoting…" : `Promote to ${selected.name}`}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
