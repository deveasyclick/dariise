import type { Context, MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";

import type {
  ApiKeyAccessContext,
  ApiKeyResolver,
} from "../modules/api-keys/index.js";
import { ApiError } from "../shared/http/errors.js";

/**
 * The API-key surface.
 *
 * A runtime credential never reaches a management route: only the routes that
 * mount this middleware accept one at all, and the session middleware is what
 * guards everything else. That is the whole enforcement — no scope check has to
 * be remembered on a management handler for an SDK key to be harmless there.
 */
export type ApiKeyEnv = {
  Variables: {
    apiKey: ApiKeyAccessContext | null;
  };
};

/** `Authorization: Bearer <secret>`, or `null` when the header is not one. */
function bearerToken(header: string | undefined): string | null {
  if (!header) return null;

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());

  return match?.[1]?.trim() || null;
}

// Takes the resolver the composition root wired up, so this file owns no query
// and imports no module instance, the way `createSessionMiddleware` works.
export function createApiKeyMiddleware(
  resolve: ApiKeyResolver,
): MiddlewareHandler<ApiKeyEnv> {
  return createMiddleware<ApiKeyEnv>(async (c, next) => {
    const secret = bearerToken(c.req.header("authorization"));

    c.set("apiKey", secret ? await resolve(secret) : null);
    await next();
  });
}

export function requireApiKey(c: Context<ApiKeyEnv>): ApiKeyAccessContext {
  const context = c.get("apiKey");

  if (!context) {
    throw ApiError.unauthorized("Present a valid SDK key to continue.");
  }

  return context;
}
