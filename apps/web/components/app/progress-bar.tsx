import { cn } from "cn";

interface ProgressBarProps {
  /** Whole percentage, 0-100. */
  value: number;
  /** Tailwind background class for the filled portion. */
  className?: string;
  label?: string;
}

/** Thin track used by rollout rows, flag health and the flags table. */
export function ProgressBar({ value, className, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
    >
      <div
        className={cn("bg-primary-ink h-full rounded-full", className)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
