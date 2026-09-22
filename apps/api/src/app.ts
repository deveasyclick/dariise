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
import { AccountController } from "./modules/account/account.controller.js";
import { AccountRepository } from "./modules/account/account.repository.js";
import { createAccountRoutes } from "./modules/account/account.routes.js";
import { AccountService } from "./modules/account/account.service.js";
import { AuditLogController } from "./modules/audit-log/audit-log.controller.js";
import { AuditLogRepository } from "./modules/audit-log/audit-log.repository.js";
import { createAuditLogRoutes } from "./modules/audit-log/audit-log.routes.js";
import { AuditLogService } from "./modules/audit-log/audit-log.service.js";
import {
  AuthController,
  AuthRepository,
  AuthService,
  createAuthConfig,
  createAuthRoutes,
} from "./modules/auth/index.js";
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
import { ProjectMembersController } from "./modules/project-members/project-members.controller.js";
import { ProjectMembersRepository } from "./modules/project-members/project-members.repository.js";
import { createProjectMembersRoutes } from "./modules/project-members/project-members.routes.js";
import { ProjectMembersService } from "./modules/project-members/project-members.service.js";
import { SegmentsController } from "./modules/segments/segments.controller.js";
import { SegmentsRepository } from "./modules/segments/segments.repository.js";
import { createSegmentsRoutes } from "./modules/segments/segments.routes.js";
import { SegmentsService } from "./modules/segments/segments.service.js";
import { WorkspaceController } from "./modules/workspace/workspace.controller.js";
import { WorkspaceRepository } from "./modules/workspace/workspace.repository.js";
import { createWorkspaceRoutes } from "./modules/workspace/workspace.routes.js";
import { WorkspaceService } from "./modules/workspace/workspace.service.js";
import { env } from "./config/index.js";
import { createConfiguredEmailTransport } from "./shared/email/email.config.js";
import { EmailService } from "./shared/email/email.service.js";
import { errorResponse } from "./shared/http/errors.js";

// Mail is optional: with no Brevo credentials the service reports `skipped` and
// the auth module keeps its development console fallback.
const emailService = new EmailService(createConfiguredEmailTransport());

console.info(
  emailService.enabled
    ? `[email] Brevo transport configured, sending from ${env.emailFrom}`
    : "[email] no transport configured — reset links are printed to this console",
);

const auth = createAuthConfig(emailService);
const authRepository = new AuthRepository();
const projectAccessRepository = new ProjectAccessRepository();
const projectsRepository = new ProjectsRepository();
const flagsRepository = new FlagsRepository();
const environmentsRepository = new EnvironmentsRepository();
const segmentsRepository = new SegmentsRepository();
const apiKeysRepository = new ApiKeysRepository();
const auditLogRepository = new AuditLogRepository();
const accountRepository = new AccountRepository();
const projectMembersRepository = new ProjectMembersRepository();
const workspaceRepository = new WorkspaceRepository();

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
const auditLogService = new AuditLogService(
  auditLogRepository,
  projectAccessService,
);
// Injected so the projects module never reaches into environments itself.
const projectsService = new ProjectsService(
  projectsRepository,
  (tx, projectId, name) => environmentsService.createDefault(tx, projectId, name),
  projectAccessService,
);
const workspaceService = new WorkspaceService(workspaceRepository);
// Injected so the flags module never imports the segments module.
const flagsService = new FlagsService(
  flagsRepository,
  projectAccessService,
  (projectId, keys) => segmentsService.findUnknownKeys(projectId, keys),
);

const authService = new AuthService(
  authRepository,
  (organizationId) => projectsService.hasProject(organizationId),
  auth.api.getSession,
  {
    updateUser: auth.api.updateUser,
    changePassword: auth.api.changePassword,
  },
);
const accountService = new AccountService(accountRepository, authService);
const projectMembersService = new ProjectMembersService(
  projectMembersRepository,
  projectAccessService,
);

const authController = new AuthController(authService);
const projectsController = new ProjectsController(projectsService);
const flagsController = new FlagsController(flagsService);
const environmentsController = new EnvironmentsController(environmentsService);
const segmentsController = new SegmentsController(segmentsService);
const apiKeysController = new ApiKeysController(apiKeysService);
const auditLogController = new AuditLogController(auditLogService);
const accountController = new AccountController(accountService);
const projectMembersController = new ProjectMembersController(
  projectMembersService,
);
const workspaceController = new WorkspaceController(workspaceService);

// One instance shared by both routers, so a request resolves its session once.
const sessionMiddleware = createSessionMiddleware((headers) =>
  authService.resolveRequestContext(headers),
);

const authRoutes = createAuthRoutes({
  controller: authController,
  sessionMiddleware,
  authHandler: auth.handler,
});
const projectRoutes = createProjectsRoutes({
  controller: projectsController,
  sessionMiddleware,
});
const workspaceRoutes = createWorkspaceRoutes({
  controller: workspaceController,
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
// Mounted at `/`: it serves both `/v1/audit-logs` and the project-scoped list.
const auditLogRoutes = createAuditLogRoutes({
  controller: auditLogController,
  sessionMiddleware,
});
// Mounted at `/`: `GET /v1/me` stays with the auth module, the writes live here.
const accountRoutes = createAccountRoutes({
  controller: accountController,
  sessionMiddleware,
});
const projectMemberRoutes = createProjectMembersRoutes({
  controller: projectMembersController,
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
app.route("/", auditLogRoutes);
app.route("/", accountRoutes);
app.route("/v1/projects", projectMemberRoutes);
app.route("/", workspaceRoutes);
app.route("/", flagRoutes);

app.notFound((c) =>
  c.json(
    { error: { code: "not_found", message: `No route for ${c.req.path}.` } },
    404,
  ),
);

app.onError((error, c) => errorResponse(c, error));
