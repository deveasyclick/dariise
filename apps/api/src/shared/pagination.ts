import type { Page } from "./types/pagination.js";

/**
 * Cursors are opaque base64url strings so a caller cannot depend on the
 * ordering column and force a breaking change when it moves.
 */
export function encodeCursor(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | undefined): string | null {
  if (!cursor) return null;

  const decoded = Buffer.from(cursor, "base64url").toString("utf8");

  return decoded.length > 0 ? decoded : null;
}

/**
 * Build a page from a query that fetched `limit + 1` rows: the extra row is the
 * signal that another page exists, so the caller never counts the whole table.
 */
export function toPage<T>(
  rows: T[],
  limit: number,
  cursorOf: (row: T) => string,
): Page<T> {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const last = data[data.length - 1];

  return {
    data,
    nextCursor: hasMore && last ? encodeCursor(cursorOf(last)) : null,
  };
}
