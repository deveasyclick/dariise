import { Hono, type MiddlewareHandler } from "hono";

import type { SessionEnv } from "../auth/auth.types.js";
import type { SegmentsController } from "./segments.controller.js";

export interface SegmentsRoutesDeps {
  controller: SegmentsController;
  sessionMiddleware: MiddlewareHandler;
}

/** Mounted at `/v1/projects`, because every path hangs off one project. */
export function createSegmentsRoutes({
  controller,
  sessionMiddleware,
}: SegmentsRoutesDeps): Hono<SessionEnv> {
  const routes = new Hono<SessionEnv>();

  routes.use("*", sessionMiddleware);

  routes.get("/:projectKey/segments", (c) => controller.list(c));
  routes.post("/:projectKey/segments", (c) => controller.create(c));
  routes.get("/:projectKey/segments/:segmentKey/flags", (c) =>
    controller.listFlags(c),
  );
  routes.get("/:projectKey/segments/:segmentKey", (c) => controller.get(c));
  routes.patch("/:projectKey/segments/:segmentKey", (c) => controller.update(c));
  routes.delete("/:projectKey/segments/:segmentKey", (c) =>
    controller.archive(c),
  );

  return routes;
}
