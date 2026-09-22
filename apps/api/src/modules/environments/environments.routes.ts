import { Hono, type MiddlewareHandler } from "hono";

import type { SessionEnv } from "../auth/auth.types.js";
import type { EnvironmentsController } from "./environments.controller.js";

export interface EnvironmentsRoutesDeps {
  controller: EnvironmentsController;
  sessionMiddleware: MiddlewareHandler;
}

/** Mounted at `/v1/projects`, because every path hangs off one project. */
export function createEnvironmentsRoutes({
  controller,
  sessionMiddleware,
}: EnvironmentsRoutesDeps): Hono<SessionEnv> {
  const routes = new Hono<SessionEnv>();

  routes.use("*", sessionMiddleware);

  routes.get("/:projectKey/environments", (c) => controller.list(c));
  routes.post("/:projectKey/environments", (c) => controller.create(c));
  routes.get("/:projectKey/environments/:environmentKey", (c) =>
    controller.get(c),
  );
  routes.patch("/:projectKey/environments/:environmentKey/settings", (c) =>
    controller.updateSettings(c),
  );

  routes.get("/:projectKey/coverage", (c) => controller.coverage(c));

  return routes;
}
