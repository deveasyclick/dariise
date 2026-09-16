"use client";

import { useRef, useState } from "react";
import { ArchiveIcon, LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveSegment } from "@/lib/segment-stub";

/**
 * Archive affordance for the segment detail screen.
 *
 * Archives locally so the pending state is real; nothing is persisted and the
 * segment returns on reload.
 */
export function SegmentArchive() {
  const [pending, setPending] = useState(false);
  const [archived, setArchived] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  async function handleArchive() {
    if (pending || archived) return;
    setPending(true);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await archiveSegment("current", controller.signal);
      setArchived(true);
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") setArchived(false);
    } finally {
      setPending(false);
    }
  }

  if (archived) {
    return (
      <section className="bg-card rounded-lg border p-4">
        <h2 className="text-[13px] font-medium">Archived</h2>
        <p className="text-muted-foreground mt-1 text-[11px]">
          This segment would be archived. Nothing is persisted, so it returns on
          reload.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 text-[11px]"
          onClick={() => setArchived(false)}
        >
          Undo
        </Button>
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
          Flags fall back to their default value.
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
    </section>
  );
}
