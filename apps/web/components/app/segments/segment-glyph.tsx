import { UsersRoundIcon } from "lucide-react";
import { cn } from "cn";

/**
 * Glyph palette. Chosen from the app-only ink tokens so a segment's colour is
 * stable and drawn from the palette rather than invented per render.
 */
const tones = [
  "bg-primary-ink/10 text-primary-ink",
  "bg-purple-ink/10 text-purple-ink",
  "bg-ok-ink/10 text-ok-ink",
  "bg-warn-ink/10 text-warn-ink",
  "bg-info-ink/10 text-info-ink",
];

/** Deterministic index so the same key always gets the same tone. */
function toneFor(key: string): string {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash + key.charCodeAt(index)) % tones.length;
  }
  return tones[hash];
}

/** Square tile used in the segment list and detail header. */
export function SegmentGlyph({
  segmentKey,
  className,
}: {
  segmentKey: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        toneFor(segmentKey),
        className,
      )}
    >
      <UsersRoundIcon className="size-4" />
    </span>
  );
}
