import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import { pool } from "./db/client.js";
import { createSessionMiddleware } from "./middleware/authorization.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { AuthRepository } from "./modules/auth/auth.repository.js";
import { createAuthRoutes } from "./modules/auth/auth.routes.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { ProjectsController } from "./modules/projects/projects.controller.js";
import { ProjectsRepository } from "./modules/projects/projects.repository.js";
import { createProjectsRoutes } from "./modules/projects/projects.routes.js";
import { ProjectsService } from "./modules/projects/projects.service.js";
import { ProjectAccessRepository } from "./modules/project-access/project-access.repository.js";
import { ProjectAccessService } from "./modules/project-access/project-access.service.js";
import { SegmentsController } from "./modules/segments/segments.controller.js";
import { SegmentsRepository } from "./modules/segments/segments.repository.js";
import { createSegmentsRoutes } from "./modules/segments/segments.routes.js";
import { SegmentsService } from "./modules/segments/segments.service.js";
import { env } from "./config/index.js";
import { errorResponse } from "./shared/http/errors.js";

const authRepository = new AuthRepository();
const projectAccessRepository = new ProjectAccessRepository();
const projectsRepository = new ProjectsRepository();
const segmentsRepository = new SegmentsRepository();

const projectAccessService = new ProjectAccessService(projectAccessRepository);
const segmentsService = new SegmentsService(
  segmentsRepository,
  projectAccessService,
);
const projectsService = new ProjectsService(projectsRepository);

const authService = new AuthService(authRepository, (organizationId) =>
  projectsService.hasProject(organizationId),
);

const authController = new AuthController(authService);
const projectsController = new ProjectsController(projectsService);
const segmentsController = new SegmentsController(segmentsService);

// One instance shared by both routers, so a request resolves its session once.
const sessionMiddleware = createSessionMiddleware((headers) =>
  authService.resolveRequestContext(headers),
);

const authRoutes = createAuthRoutes({
  controller: authController,
  sessionMiddleware,
});
const projectRoutes = createProjectsRoutes({
  controller: projectsController,
  sessionMiddleware,
});
const segmentRoutes = createSegmentsRoutes({
  controller: segmentsController,
  sessionMiddleware,
});

export const app = new Hono();

app.use("*", secureHeaders());
app.use("*", logger());

app.use("*", (c, next) =>
  cors({
    origin: (origin) =>
      env.corsOrigins.includes(origin) ? origin : undefined,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    maxAge: 600,
  })(c, next),
);

app.get("/healthz", (c) => c.json({ status: "ok" }));

app.get("/readyz", async (c) => {
  const checks: Record<string, "ok" | "error" | "not_configured"> = {};

  try {
    await pool.query("select 1");
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  checks.redis = "not_configured";

  const ready = checks.database === "ok";

  return c.json(
    { status: ready ? "ready" : "unready", checks },
    ready ? 200 : 503,
  );
});

app.route("/", authRoutes);
app.route("/v1/projects", projectRoutes);
app.route("/v1/projects", segmentRoutes);

app.notFound((c) =>
  c.json(
    { error: { code: "not_found", message: `No route for ${c.req.path}.` } },
    404,
  ),
);

app.onError((error, c) => errorResponse(c, error));
