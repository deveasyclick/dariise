import { createProjectSchema } from "@dariise/contracts";
import type { Context } from "hono";

import { requireWorkspace } from "../../middleware/authorization.js";
import { ApiError } from "../../shared/http/errors.js";
import type { SessionEnv } from "../auth/auth.types.js";
import type { ProjectsService } from "./projects.service.js";

export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  /** The session middleware has already resolved the context by this point. */
  async create(c: Context<SessionEnv>): Promise<Response> {
    const context = await this.requireWorkspace(c);

    const parsed = createProjectSchema.safeParse(await c.req.json());

    if (!parsed.success) {
      throw ApiError.badRequest(this.firstIssue(parsed.error.issues));
    }

    const created = await this.service.create(
      context.workspace.id,
      context.user.id,
      parsed.data,
    );

    return c.json(created, 201);
  }

  private requireWorkspace(c: Context<SessionEnv>) {
    return requireWorkspace(c);
  }

  private firstIssue(issues: ReadonlyArray<{ message: string }>): string {
    return issues[0]?.message ?? "The project details are not valid.";
  }
}
