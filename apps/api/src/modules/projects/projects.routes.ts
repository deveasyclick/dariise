import { Hono, type MiddlewareHandler } from "hono";

import type { SessionEnv } from "../auth/auth.types.js";
import type { ProjectsController } from "./projects.controller.js";

export interface ProjectsRoutesDeps {
  controller: ProjectsController;
  sessionMiddleware: MiddlewareHandler;
}

// Owns every path the projects module serves; `app.ts` owns construction and mounting.
export function createProjectsRoutes({
  controller,
  sessionMiddleware,
}: ProjectsRoutesDeps): Hono<SessionEnv> {
  const routes = new Hono<SessionEnv>();

  routes.use("*", sessionMiddleware);

  // Mounted at `/v1/projects` in `app.ts`; the router owns the paths below it.
  routes.get("/", (c) => controller.list(c));
  routes.post("/", (c) => controller.create(c));
  routes.get("/:projectKey", (c) => controller.get(c));
  routes.patch("/:projectKey", (c) => controller.update(c));

  return routes;
}
