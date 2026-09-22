import { Hono, type MiddlewareHandler } from "hono";

import type { SessionEnv } from "../auth/auth.types.js";
import type { ProjectMembersController } from "./project-members.controller.js";

export interface ProjectMembersRoutesDeps {
  controller: ProjectMembersController;
  sessionMiddleware: MiddlewareHandler;
}

/** Mounted at `/v1/projects`, because every path hangs off one project. */
export function createProjectMembersRoutes({
  controller,
  sessionMiddleware,
}: ProjectMembersRoutesDeps): Hono<SessionEnv> {
  const routes = new Hono<SessionEnv>();

  routes.use("*", sessionMiddleware);

  routes.get("/:projectKey/members", (c) => controller.list(c));
  routes.post("/:projectKey/members", (c) => controller.add(c));
  routes.patch("/:projectKey/members/:userId", (c) => controller.updateRole(c));
  routes.delete("/:projectKey/members/:userId", (c) => controller.remove(c));

  return routes;
}
