import { Hono, type MiddlewareHandler } from "hono";

import type { AuthController } from "./auth.controller.js";
import type { AuthHandler, SessionEnv } from "./auth.types.js";

export interface AuthRoutesDeps {
  controller: AuthController;
  sessionMiddleware: MiddlewareHandler;
  authHandler: AuthHandler;
}

// Owns every path the auth module serves; `app.ts` owns construction and mounting.
export function createAuthRoutes({
  controller,
  sessionMiddleware,
  authHandler,
}: AuthRoutesDeps): Hono<SessionEnv> {
  const routes = new Hono<SessionEnv>();

  // Better Auth owns `/api/auth/*`; we only forward the raw request.
  routes.all("/api/auth/*", (c) => authHandler(c.req.raw));

  routes.get("/v1/auth/providers", (c) => controller.providers(c));

  routes.get("/v1/me", sessionMiddleware, (c) => controller.me(c));

  return routes;
}
