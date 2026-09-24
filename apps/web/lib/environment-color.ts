/**
 * Environment colour names.
 *
 * The API stores a project's and an environment's colour as a free-form string,
 * because the column predates the palette. The dashboard can only render a
 * colour it has a Tailwind class for, so every colour that arrives from the API
 * goes through `resolveEnvironmentColor` before it reaches a class map.
 */

export const ENVIRONMENT_COLORS = [
  "primary",
  "cyan",
  "purple",
  "green",
  "indigo",
  "slate",
] as const;

export type EnvironmentColor = (typeof ENVIRONMENT_COLORS)[number];

const FALLBACK_COLOR: EnvironmentColor = "primary";

/** Narrow an API colour string to one this app has a class for. */
export function resolveEnvironmentColor(
  value: string | null | undefined,
): EnvironmentColor {
  return ENVIRONMENT_COLORS.includes(value as EnvironmentColor)
    ? (value as EnvironmentColor)
    : FALLBACK_COLOR;
}
