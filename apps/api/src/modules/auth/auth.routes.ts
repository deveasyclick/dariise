import { Hono, type MiddlewareHandler } from "hono";

import type { AuthController } from "./auth.controller.js";
import { authHandler } from "./auth.service.js";
import type { SessionEnv } from "./auth.types.js";

export interface AuthRoutesDeps {
  controller: AuthController;
  sessionMiddleware: MiddlewareHandler;
}

/**
 * Owns every path the auth module serves. Construction and mounting are owned
 * by `app.ts`.
 */
export function createAuthRoutes({
  controller,
  sessionMiddleware,
}: AuthRoutesDeps): Hono<SessionEnv> {
  const routes = new Hono<SessionEnv>();

  // Better Auth owns `/api/auth/*`; we only forward the raw request.
  routes.all("/api/auth/*", (c) => authHandler(c.req.raw));

  routes.get("/v1/auth/providers", (c) => controller.providers(c));

  routes.get("/v1/me", sessionMiddleware, (c) => controller.me(c));

  return routes;
}
