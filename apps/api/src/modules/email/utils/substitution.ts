const PLACEHOLDER = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

/** Substitute into markup, where a value may not inject elements or attributes. */
export function substituteHtml(
  source: string,
  values: Record<string, string>,
): string {
  return replace(source, values, escapeHtml);
}

/** Substitute into a subject or a text body, which carry no markup to escape. */
export function substituteText(
  source: string,
  values: Record<string, string>,
): string {
  return replace(source, values, (value) => value);
}

function replace(
  source: string,
  values: Record<string, string>,
  escapeValue: (value: string) => string,
): string {
  return source.replaceAll(PLACEHOLDER, (_match, key: string) => {
    const value = values[key];

    if (value === undefined) {
      throw new Error(`Unknown email template variable "{{${key}}}".`);
    }

    return escapeValue(value);
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
