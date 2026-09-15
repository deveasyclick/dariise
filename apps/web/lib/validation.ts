/**
 * Small, dependency-free field validators shared by the authentication forms.
 *
 * These intentionally run on submit rather than on every keystroke, so the user
 * is not shown errors before they have had a chance to finish typing. The forms
 * clear an individual error as soon as its field is edited.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WORKSPACE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isRequired(value: string, label: string): string | null {
  return value.trim() ? null : `${label} is required.`;
}

export function isEmail(value: string): string | null {
  return EMAIL_PATTERN.test(value.trim())
    ? null
    : "Enter a valid email address.";
}

export function minLength(
  value: string,
  length: number,
  label: string,
): string | null {
  return value.length >= length
    ? null
    : `${label} must be at least ${length} characters.`;
}

export function isValidWorkspaceSlug(value: string): string | null {
  const slug = value.trim();

  if (!slug) return "Workspace slug is required.";
  if (slug.length < 3) {
    return "Workspace slug must be at least 3 characters.";
  }
  if (slug.length > 40) {
    return "Workspace slug must be at most 40 characters.";
  }
  if (!WORKSPACE_SLUG_PATTERN.test(slug)) {
    return "Use lowercase letters, numbers and single hyphens only.";
  }

  return null;
}

/**
 * Only validate a website when the field has been filled in, since it is
 * optional. A missing scheme is accepted and normalised on submit.
 */
export function isValidOptionalUrl(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(candidate);
    return url.hostname.includes(".") ? null : "Enter a valid website URL.";
  } catch {
    return "Enter a valid website URL.";
  }
}

/** Turn a human-readable workspace name into a slug candidate. */
export function toWorkspaceSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
