import { Hono, type MiddlewareHandler } from "hono";

import type { SessionEnv } from "../auth/auth.types.js";
import type { EvaluationController } from "./evaluation.controller.js";

export interface EvaluationRoutesDeps {
  controller: EvaluationController;
  sessionMiddleware: MiddlewareHandler;
}

/** Mounted at `/`: the module owns `/v1/evaluate`, outside any project path. */
export function createEvaluationRoutes({
  controller,
  sessionMiddleware,
}: EvaluationRoutesDeps): Hono<SessionEnv> {
  const routes = new Hono<SessionEnv>();

  routes.use("*", sessionMiddleware);

  routes.post("/v1/evaluate", (c) => controller.evaluate(c));

  return routes;
}
