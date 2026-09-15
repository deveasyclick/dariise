/**
 * Runtime configuration for the web application.
 *
 * Only variables prefixed with `NEXT_PUBLIC_` are available in the browser;
 * everything else is server-only and must not be imported from a Client
 * Component.
 */

const DEFAULT_API_URL = "http://localhost:8000";

function readApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;

  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "NEXT_PUBLIC_API_URL must be set for production builds. Copy apps/web/.env.example to .env.local and provide the Dariise API base URL.",
      );
    }

    return DEFAULT_API_URL;
  }

  return raw.replace(/\/+$/, "");
}

/** Base URL of the Dariise API, without a trailing slash. */
export const API_URL = readApiUrl();
