"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArchiveIcon, LoaderCircleIcon } from "lucide-react";
import { FieldError } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { ApiError, segments } from "@/lib/api";

interface SegmentArchiveProps {
  projectKey: string;
  segmentKey: string;
  archived: boolean;
}

/**
 * Archive affordance for the segment detail screen.
 *
 * Archiving is not reversible through the API, so the archived state offers no
 * undo.
 */
export function SegmentArchive({
  projectKey,
  segmentKey,
  archived,
}: SegmentArchiveProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(archived);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  async function handleArchive() {
    if (pending || done) return;
    setPending(true);
    setError(null);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await segments.archive(projectKey, segmentKey, {
        signal: controller.signal,
      });
      setDone(true);
      router.refresh();
    } catch (cause) {
      if ((cause as Error)?.name === "AbortError") return;
      setError(
        cause instanceof ApiError
          ? cause.message
          : "The segment could not be archived. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <section className="bg-card rounded-lg border p-4">
        <h2 className="text-[13px] font-medium">Archived</h2>
        <p className="text-muted-foreground mt-1 text-[11px]">
          This segment is archived and hidden from the segments list. Flags that
          reference its key keep evaluating it unchanged.
        </p>
      </section>
    );
  }

  return (
    <section className="border-danger-ink/30 bg-danger-ink/5 rounded-lg border p-4">
      <h2 className="text-danger-ink text-[13px] font-medium">
        Archive segment
      </h2>
      <div className="mt-2 flex items-start justify-between gap-4">
        <p className="text-muted-foreground text-[11px]">
          Archiving hides the segment from the segments list. Flags that
          reference its key keep evaluating it unchanged.
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={handleArchive}
          className="border-danger-ink/40 text-danger-ink shrink-0 gap-1.5 text-[11px]"
        >
          {pending ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <ArchiveIcon aria-hidden="true" className="size-3.5" />
          )}
          {pending ? "Archiving…" : "Archive"}
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
