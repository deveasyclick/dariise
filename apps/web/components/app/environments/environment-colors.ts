import type { EnvironmentColor } from "@/lib/environment-data";

/**
 * Colour presentation for environments.
 *
 * Tailwind only sees class names that appear literally in the source, so the
 * colour a user picked on the create screen has to resolve through a static map
 * rather than an interpolated class name. Every value is a design token, so
 * light and dark stay in step.
 */

/** Options offered by the create screen's swatch picker, in design order. */
export const environmentColors: Array<{
  value: EnvironmentColor;
  label: string;
}> = [
  { value: "primary", label: "Blue" },
  { value: "cyan", label: "Cyan" },
  { value: "purple", label: "Purple" },
  { value: "green", label: "Green" },
  { value: "indigo", label: "Indigo" },
  { value: "slate", label: "Slate" },
];

/** Icon-tile tint for an environment, used by the detail header. */
export const environmentColorTone: Record<EnvironmentColor, string> = {
  primary: "bg-primary/10 text-primary",
  cyan: "bg-info-ink/10 text-info-ink",
  purple: "bg-purple-ink/10 text-purple-ink",
  green: "bg-ok-ink/10 text-ok-ink",
  indigo: "bg-primary-ink/10 text-primary-ink",
  slate: "bg-muted text-slate-ink",
};

/**
 * Solid fill for the create screen's swatches and their selected dot.
 *
 * Each entry repeats its colour under `data-checked:` so a selected swatch keeps
 * its own colour instead of taking the RadioGroup primitive's default primary
 * fill.
 */
export const environmentColorSwatch: Record<EnvironmentColor, string> = {
  primary: "bg-primary data-checked:bg-primary",
  cyan: "bg-info-ink data-checked:bg-info-ink",
  purple: "bg-purple-ink data-checked:bg-purple-ink",
  green: "bg-ok-ink data-checked:bg-ok-ink",
  indigo: "bg-primary-ink data-checked:bg-primary-ink",
  slate: "bg-slate-ink data-checked:bg-slate-ink",
};
