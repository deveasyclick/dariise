import type { EnvironmentColor } from "@/lib/environment-color";

/**
 * Environment colour as a chart fill.
 *
 * `environment-colors.ts` covers tinted icon tiles and the create screen's radio
 * swatches; a chart needs a solid fill, and the conic-gradient ring needs the
 * raw token rather than a class name. Both maps live here so a series and its
 * legend dot cannot drift.
 */
export const seriesFillClass: Record<EnvironmentColor, string> = {
  primary: "bg-primary-ink",
  cyan: "bg-info-ink",
  purple: "bg-purple-ink",
  green: "bg-ok-ink",
  indigo: "bg-primary-ink",
  slate: "bg-slate-ink",
};

/** The same colours as gradient stops, for the environment ring. */
export const seriesColorVar: Record<EnvironmentColor, string> = {
  primary: "var(--primary-ink)",
  cyan: "var(--info-ink)",
  purple: "var(--purple-ink)",
  green: "var(--ok-ink)",
  indigo: "var(--primary-ink)",
  slate: "var(--slate-ink)",
};
