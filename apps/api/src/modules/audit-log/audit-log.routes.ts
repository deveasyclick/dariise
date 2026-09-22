import { Hono, type MiddlewareHandler } from "hono";

import type { SessionEnv } from "../auth/auth.types.js";
import type { AuditLogController } from "./audit-log.controller.js";

export interface AuditLogRoutesDeps {
  controller: AuditLogController;
  sessionMiddleware: MiddlewareHandler;
}

/**
 * Mounted at `/`: the module owns the project-scoped list and the
 * workspace-wide `/v1/audit-logs` the global screen renders.
 */
export function createAuditLogRoutes({
  controller,
  sessionMiddleware,
}: AuditLogRoutesDeps): Hono<SessionEnv> {
  const routes = new Hono<SessionEnv>();

  routes.use("*", sessionMiddleware);

  routes.get("/v1/audit-logs", (c) => controller.listForWorkspace(c));
  routes.get("/v1/projects/:projectKey/audit-logs", (c) =>
    controller.listForProject(c),
  );

  return routes;
}
