import { Hono, type MiddlewareHandler } from "hono";

import type { SessionEnv } from "../auth/auth.types.js";
import type { ApiKeysController } from "./api-keys.controller.js";

export interface ApiKeysRoutesDeps {
  controller: ApiKeysController;
  sessionMiddleware: MiddlewareHandler;
}

/** Mounted at `/v1/projects`, because every path hangs off one project. */
export function createApiKeysRoutes({
  controller,
  sessionMiddleware,
}: ApiKeysRoutesDeps): Hono<SessionEnv> {
  const routes = new Hono<SessionEnv>();

  routes.use("*", sessionMiddleware);

  routes.get("/:projectKey/api-keys", (c) => controller.list(c));
  routes.post("/:projectKey/api-keys", (c) => controller.create(c));
  routes.delete("/:projectKey/api-keys/:keyId", (c) => controller.revoke(c));

  return routes;
}
