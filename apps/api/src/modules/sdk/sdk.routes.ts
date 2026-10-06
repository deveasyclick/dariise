import { Hono, type MiddlewareHandler } from "hono";

import type { ApiKeyEnv } from "../../middleware/api-key.js";
import type { SdkController } from "./sdk.controller.js";

export interface SdkRoutesDeps {
  controller: SdkController;
  /** The key middleware is the only credential this surface accepts. */
  apiKeyMiddleware: MiddlewareHandler<ApiKeyEnv>;
}

/** Mounted at `/`: the SDK surface sits outside any project path. */
export function createSdkRoutes({
  controller,
  apiKeyMiddleware,
}: SdkRoutesDeps): Hono<ApiKeyEnv> {
  const routes = new Hono<ApiKeyEnv>();

  // Scoped to the one path: a bare "*" on a router mounted at "/" would run
  // this on every route, not just this surface.
  routes.use("/v1/sdk/config", apiKeyMiddleware);

  routes.get("/v1/sdk/config", (c) => controller.config(c));

  return routes;
}
