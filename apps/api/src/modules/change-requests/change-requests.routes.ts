import { Hono, type MiddlewareHandler } from "hono";

import type { SessionEnv } from "../auth/auth.types.js";
import type { ChangeRequestsController } from "./change-requests.controller.js";

export interface ChangeRequestsRoutesDeps {
  controller: ChangeRequestsController;
  sessionMiddleware: MiddlewareHandler;
}

/**
 * Mounted at `/v1/projects`: a change request is addressed under the flag it
 * proposes a change to, so the paths stay inside the flags resource.
 */
export function createChangeRequestsRoutes({
  controller,
  sessionMiddleware,
}: ChangeRequestsRoutesDeps): Hono<SessionEnv> {
  const routes = new Hono<SessionEnv>();

  routes.use("*", sessionMiddleware);

  routes.get("/:projectKey/flags/:flagKey/change-requests", (c) =>
    controller.list(c),
  );
  routes.post("/:projectKey/flags/:flagKey/change-requests", (c) =>
    controller.create(c),
  );
  routes.post(
    "/:projectKey/flags/:flagKey/change-requests/:requestId/approve",
    (c) => controller.approve(c),
  );
  routes.post(
    "/:projectKey/flags/:flagKey/change-requests/:requestId/reject",
    (c) => controller.reject(c),
  );

  return routes;
}
