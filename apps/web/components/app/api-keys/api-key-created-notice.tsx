import { TriangleAlertIcon } from "lucide-react";
import { CopyButton } from "@/components/app/copy-button";
import { Badge } from "@/components/ui/badge";
import type { ApiKeyView } from "@/lib/api-key-data";

/**
 * Confirmation shown on the list straight after a key is issued.
 *
 * This is the only place the full credential is rendered: the create stub keeps
 * it for the session that issued it and nothing is persisted, which is what
 * makes "shown once" true rather than decorative.
 */
export function ApiKeyCreatedNotice({ apiKey }: { apiKey: ApiKeyView }) {
  return (
    <section
      aria-live="polite"
      className="bg-info-ink/5 border-info-ink/20 rounded-lg border p-4"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="bg-info-ink/10 text-info-ink flex size-8 shrink-0 items-center justify-center rounded-lg">
          <TriangleAlertIcon aria-hidden="true" className="size-4" />
        </span>
        <p className="text-[13px] font-medium">{apiKey.name} key created</p>
        <Badge variant="warn" className="gap-1 text-[10px]">
          <TriangleAlertIcon aria-hidden="true" />
          Shown once
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="bg-muted min-w-0 flex-1 truncate rounded-md px-2.5 py-1.5 font-mono text-[11px]">
          {apiKey.value}
        </p>
        <CopyButton
          value={apiKey.value}
          label={`${apiKey.name} key`}
          labelled
          className="shrink-0"
        />
      </div>

      <p className="text-muted-foreground mt-2 text-[11px]">
        Copy it somewhere safe. For security, it cannot be viewed again after you
        leave this page.
      </p>
    </section>
  );
}
