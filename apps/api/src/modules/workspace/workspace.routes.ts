import { Hono, type MiddlewareHandler } from "hono";

import type { SessionEnv } from "../auth/auth.types.js";
import type { WorkspaceController } from "./workspace.controller.js";

export interface WorkspaceRoutesDeps {
  controller: WorkspaceController;
  sessionMiddleware: MiddlewareHandler;
}

/** Mounted at `/`: the workspace is the session's own organization. */
export function createWorkspaceRoutes({
  controller,
  sessionMiddleware,
}: WorkspaceRoutesDeps): Hono<SessionEnv> {
  const routes = new Hono<SessionEnv>();

  routes.use("*", sessionMiddleware);

  routes.get("/v1/workspace", (c) => controller.getProfile(c));
  routes.patch("/v1/workspace", (c) => controller.updateProfile(c));
  routes.get("/v1/workspace/security", (c) => controller.getSecurity(c));
  routes.patch("/v1/workspace/security", (c) => controller.updateSecurity(c));

  return routes;
}
