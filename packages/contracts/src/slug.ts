import { z } from "zod";

/** Lowercase alphanumerics with single hyphens, e.g. `acme-inc`. */
export const WORKSPACE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 40;

export const workspaceSlugSchema = z
  .string()
  .trim()
  .min(
    SLUG_MIN_LENGTH,
    `Workspace slug must be at least ${SLUG_MIN_LENGTH} characters.`,
  )
  .max(
    SLUG_MAX_LENGTH,
    `Workspace slug must be at most ${SLUG_MAX_LENGTH} characters.`,
  )
  .check((ctx) => {
    if (!WORKSPACE_SLUG_PATTERN.test(ctx.value)) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        message: "Use lowercase letters, numbers and single hyphens only.",
      });
    }
  });

/**
 * A key for a project-scoped resource: environments, flags, segments and API
 * keys all use the same shape. Shorter than a workspace slug because keys like
 * `dev` and `on` are legitimate.
 */
export const resourceKeySchema = z
  .string()
  .trim()
  .min(1, "Key is required.")
  .max(
    SLUG_MAX_LENGTH,
    `Key must be at most ${SLUG_MAX_LENGTH} characters.`,
  )
  .check((ctx) => {
    if (!WORKSPACE_SLUG_PATTERN.test(ctx.value)) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        message: "Use lowercase letters, numbers and single hyphens only.",
      });
    }
  });

/**
 * Turn a human-readable name into a slug candidate.
 *
 * Kept in lockstep with `apps/web/lib/validation.ts#toWorkspaceSlug`, which the
 * create-workspace form uses to keep the slug field in step with the name.
 */
export function toWorkspaceSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH);
}
