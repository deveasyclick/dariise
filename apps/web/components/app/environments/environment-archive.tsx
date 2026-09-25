"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  LoaderCircleIcon,
} from "lucide-react";
import { FieldError } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { ApiError, environments } from "@/lib/api";

interface EnvironmentArchiveProps {
  projectKey: string;
  environmentKey: string;
  environmentName: string;
  archived: boolean;
}

/**
 * Archive and restore for one environment.
 *
 * Archiving revokes the environment's own SDK keys and is confirmed inline
 * rather than through a dialog, because this codebase has no dialog primitive
 * and adding one for a single action is not worth the dependency.
 */
export function EnvironmentArchive({
  projectKey,
  environmentKey,
  environmentName,
  archived,
}: EnvironmentArchiveProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  async function mutate(action: "archive" | "unarchive") {
    if (pending) return;
    setPending(true);
    setError(null);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const options = { signal: controller.signal };

      if (action === "archive") {
        await environments.archive(projectKey, environmentKey, options);
      } else {
        await environments.unarchive(projectKey, environmentKey, options);
      }

      setConfirming(false);
      router.refresh();
    } catch (cause) {
      if ((cause as Error)?.name === "AbortError") return;

      setError(
        cause instanceof ApiError
          ? cause.message
          : `The environment could not be ${action === "archive" ? "archived" : "restored"}. Please try again.`,
      );
    } finally {
      setPending(false);
    }
  }

  if (archived) {
    return (
      <section className="bg-card rounded-lg border p-4">
        <h2 className="text-[13px] font-medium">Archived</h2>
        <p className="text-muted-foreground mt-1 text-[11px]">
          {environmentName} is archived and stays out of the environment
          switcher. Its flag configuration is preserved, and the SDK keys it
          revoked stay revoked when you restore it.
        </p>

        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => mutate("unarchive")}
            className="gap-1.5 text-[11px]"
          >
            {pending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <ArchiveRestoreIcon aria-hidden="true" className="size-3.5" />
            )}
            {pending ? "Restoring…" : "Restore environment"}
          </Button>
        </div>

        {error ? (
          <div className="mt-2">
            <FieldError>{error}</FieldError>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="border-danger-ink/30 bg-danger-ink/5 rounded-lg border p-4">
      <h2 className="text-danger-ink text-[13px] font-medium">
        Archive environment
      </h2>

      {confirming ? (
        <>
          <p className="text-muted-foreground mt-2 text-[11px] leading-5">
            Archive {environmentName}? Applications using this environment will
            no longer be able to evaluate flags with its API credentials. Its
            flag configuration is preserved, and the environment can be restored
            later.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              disabled={pending}
              onClick={() => mutate("archive")}
              className="gap-1.5 text-[11px]"
            >
              {pending ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <ArchiveIcon aria-hidden="true" className="size-3.5" />
              )}
              {pending ? "Archiving…" : "Archive environment"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setConfirming(false)}
              className="text-[11px]"
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <div className="mt-2 flex items-start justify-between gap-4">
          <p className="text-muted-foreground text-[11px]">
            Archiving revokes this environment&apos;s SDK keys and hides it from
            the dashboard. Flags, targeting and rollout history are kept.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirming(true)}
            className="border-danger-ink/40 text-danger-ink shrink-0 gap-1.5 text-[11px]"
          >
            <ArchiveIcon aria-hidden="true" className="size-3.5" />
            Archive
          </Button>
        </div>
      )}

      {error ? (
        <div className="mt-2">
          <FieldError>{error}</FieldError>
        </div>
      ) : null}
    </section>
  );
}
