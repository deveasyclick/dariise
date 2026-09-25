import { Hono, type MiddlewareHandler } from "hono";

import type { SessionEnv } from "../auth/auth.types.js";
import type { FlagsController } from "./flags.controller.js";

export interface FlagsRoutesDeps {
  controller: FlagsController;
  sessionMiddleware: MiddlewareHandler;
}

/**
 * Mounted at `/`, because the module owns both the workspace-wide `/v1/flags`
 * list and the environment-scoped flag paths.
 *
 * A flag is addressed inside the environment it belongs to. Its key is unique
 * within that environment, not within the project, so the environment is part
 * of the path rather than an afterthought.
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

  const flagPath =
    "/v1/projects/:projectKey/environments/:environmentKey/flags/:flagKey";

  routes.get(flagPath, (c) => controller.get(c));
  routes.patch(flagPath, (c) => controller.update(c));
  routes.delete(flagPath, (c) => controller.archive(c));

  routes.patch(`${flagPath}/config`, (c) =>
    controller.updateEnvironmentConfig(c),
  );

  routes.get(`${flagPath}/rules`, (c) => controller.getRules(c));
  routes.put(`${flagPath}/rules`, (c) => controller.replaceRules(c));

  routes.get(`${flagPath}/targets`, (c) => controller.getTargets(c));
  routes.put(`${flagPath}/targets`, (c) => controller.replaceTargets(c));

  routes.get(`${flagPath}/dependencies`, (c) => controller.getDependencies(c));
  routes.get(`${flagPath}/versions`, (c) => controller.listVersions(c));

  routes.post(`${flagPath}/promote`, (c) => controller.promote(c));

  return routes;
}
