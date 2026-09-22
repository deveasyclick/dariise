import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import { pool } from "./db/client.js";
import { createSessionMiddleware } from "./middleware/authorization.js";
import { ApiKeysController } from "./modules/api-keys/api-keys.controller.js";
import { ApiKeysRepository } from "./modules/api-keys/api-keys.repository.js";
import { createApiKeysRoutes } from "./modules/api-keys/api-keys.routes.js";
import { ApiKeysService } from "./modules/api-keys/api-keys.service.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { AuthRepository } from "./modules/auth/auth.repository.js";
import { createAuthRoutes } from "./modules/auth/auth.routes.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { EnvironmentsController } from "./modules/environments/environments.controller.js";
import { EnvironmentsRepository } from "./modules/environments/environments.repository.js";
import { createEnvironmentsRoutes } from "./modules/environments/environments.routes.js";
import { EnvironmentsService } from "./modules/environments/environments.service.js";
import { ProjectsController } from "./modules/projects/projects.controller.js";
import { ProjectsRepository } from "./modules/projects/projects.repository.js";
import { createProjectsRoutes } from "./modules/projects/projects.routes.js";
import { ProjectsService } from "./modules/projects/projects.service.js";
import { FlagsController } from "./modules/flags/flags.controller.js";
import { FlagsRepository } from "./modules/flags/flags.repository.js";
import { createFlagsRoutes } from "./modules/flags/flags.routes.js";
import { FlagsService } from "./modules/flags/flags.service.js";
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
const flagsRepository = new FlagsRepository();
const environmentsRepository = new EnvironmentsRepository();
const segmentsRepository = new SegmentsRepository();
const apiKeysRepository = new ApiKeysRepository();

const projectAccessService = new ProjectAccessService(projectAccessRepository);
const environmentsService = new EnvironmentsService(
  environmentsRepository,
  projectAccessService,
);
const segmentsService = new SegmentsService(
  segmentsRepository,
  projectAccessService,
);
const apiKeysService = new ApiKeysService(
  apiKeysRepository,
  projectAccessService,
);
// Injected so the projects module never reaches into environments itself.
const projectsService = new ProjectsService(
  projectsRepository,
  (tx, projectId, name) => environmentsService.createDefault(tx, projectId, name),
  projectAccessService,
);
// Injected so the flags module never imports the segments module.
const flagsService = new FlagsService(
  flagsRepository,
  projectAccessService,
  (projectId, keys) => segmentsService.findUnknownKeys(projectId, keys),
);

const authService = new AuthService(authRepository, (organizationId) =>
  projectsService.hasProject(organizationId),
);

const authController = new AuthController(authService);
const projectsController = new ProjectsController(projectsService);
const flagsController = new FlagsController(flagsService);
const environmentsController = new EnvironmentsController(environmentsService);
const segmentsController = new SegmentsController(segmentsService);
const apiKeysController = new ApiKeysController(apiKeysService);

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
// Mounted at `/`: the module owns both the project-scoped paths and `/v1/flags`.
const flagRoutes = createFlagsRoutes({
  controller: flagsController,
  sessionMiddleware,
});
// A second router under `/v1/projects`, for the environment sub-resources.
const environmentRoutes = createEnvironmentsRoutes({
  controller: environmentsController,
  sessionMiddleware,
});
const segmentRoutes = createSegmentsRoutes({
  controller: segmentsController,
  sessionMiddleware,
});
const apiKeyRoutes = createApiKeysRoutes({
  controller: apiKeysController,
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
app.route("/v1/projects", environmentRoutes);
app.route("/v1/projects", segmentRoutes);
app.route("/v1/projects", apiKeyRoutes);
app.route("/", flagRoutes);

app.notFound((c) =>
  c.json(
    { error: { code: "not_found", message: `No route for ${c.req.path}.` } },
    404,
  ),
);

app.onError((error, c) => errorResponse(c, error));
