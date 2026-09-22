import { Hono, type MiddlewareHandler } from "hono";

import type { SessionEnv } from "../auth/auth.types.js";
import type { FlagsController } from "./flags.controller.js";

export interface FlagsRoutesDeps {
  controller: FlagsController;
  sessionMiddleware: MiddlewareHandler;
}

/**
 * Mounted at `/`, because the module owns both the project-scoped flag paths
 * and the workspace-wide `/v1/flags` list.
 */
export function createFlagsRoutes({
  controller,
  sessionMiddleware,
}: FlagsRoutesDeps): Hono<SessionEnv> {
  const routes = new Hono<SessionEnv>();

  routes.use("*", sessionMiddleware);

  routes.get("/v1/flags", (c) => controller.listWorkspace(c));
  routes.get("/v1/flags/:flagKey", (c) => controller.resolve(c));

  routes.get("/v1/projects/:projectKey/flags", (c) => controller.list(c));
  routes.post("/v1/projects/:projectKey/flags", (c) => controller.create(c));

  routes.get(
    "/v1/projects/:projectKey/flags/:flagKey/environments/:environmentKey",
    (c) => controller.getEnvironmentConfig(c),
  );
  routes.patch(
    "/v1/projects/:projectKey/flags/:flagKey/environments/:environmentKey",
    (c) => controller.updateEnvironmentConfig(c),
  );

  routes.get(
    "/v1/projects/:projectKey/flags/:flagKey/environments/:environmentKey/rules",
    (c) => controller.getRules(c),
  );
  routes.put(
    "/v1/projects/:projectKey/flags/:flagKey/environments/:environmentKey/rules",
    (c) => controller.replaceRules(c),
  );

  routes.get(
    "/v1/projects/:projectKey/flags/:flagKey/environments/:environmentKey/targets",
    (c) => controller.getTargets(c),
  );
  routes.put(
    "/v1/projects/:projectKey/flags/:flagKey/environments/:environmentKey/targets",
    (c) => controller.replaceTargets(c),
  );

  routes.get("/v1/projects/:projectKey/flags/:flagKey/dependencies", (c) =>
    controller.getDependencies(c),
  );
  routes.get("/v1/projects/:projectKey/flags/:flagKey/versions", (c) =>
    controller.listVersions(c),
  );

  routes.get("/v1/projects/:projectKey/flags/:flagKey", (c) => controller.get(c));
  routes.patch("/v1/projects/:projectKey/flags/:flagKey", (c) =>
    controller.update(c),
  );
  routes.delete("/v1/projects/:projectKey/flags/:flagKey", (c) =>
    controller.archive(c),
  );

  return routes;
}
