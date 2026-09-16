"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

/**
 * Copy a value to the clipboard.
 *
 * Clipboard access is refused in insecure contexts and by some browsers. The
 * refusal is reported rather than thrown: every caller already shows the value
 * on screen, so there is nothing useful to do about it.
 *
 * Exported on its own for callers that cannot use `CopyButton` — a dropdown menu
 * item, for instance.
 */
export async function writeToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

interface CopyButtonProps {
  value: string;
  /** Noun used in the accessible label, e.g. `Production SDK key`. */
  label: string;
  /** Render a labelled button instead of the icon-only default. */
  labelled?: boolean;
  className?: string;
}

/**
 * Copy-to-clipboard with a brief acknowledgement.
 *
 * Shared by the SDK key chips and the API key screens so there is one clipboard
 * implementation rather than several.
 */
export function CopyButton({
  value,
  label,
  labelled = false,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  async function handleCopy() {
    if (!(await writeToClipboard(value))) return;

    setCopied(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 2_000);
  }

  const accessibleLabel = copied ? `${label} copied` : `Copy ${label}`;

  if (labelled) {
    return (
      <Button
        type="button"
        size="sm"
        onClick={handleCopy}
        className={cn("gap-1.5 text-[11px]", className)}
        aria-label={accessibleLabel}
        title={copied ? "Copied" : `Copy ${label}`}
      >
        {copied ? (
          <CheckIcon aria-hidden="true" className="size-3.5" />
        ) : (
          <CopyIcon aria-hidden="true" className="size-3.5" />
        )}
        {copied ? "Copied" : "Copy"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={handleCopy}
      className={className}
      aria-label={accessibleLabel}
      title={copied ? "Copied" : `Copy ${label}`}
    >
      {copied ? (
        <CheckIcon aria-hidden="true" className="text-ok-ink" />
      ) : (
        <CopyIcon aria-hidden="true" />
      )}
    </Button>
  );
}
