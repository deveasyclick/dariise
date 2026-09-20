import type { Context } from "hono";

import { requireSession } from "../../middleware/authorization.js";
import type { AuthService } from "./auth.service.js";
import type { SessionEnv } from "./auth.types.js";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  providers(c: Context<SessionEnv>): Response {
    return c.json({ enabled: this.service.providersForDeployment() });
  }

  /** The session middleware has already resolved the context by this point. */
  async me(c: Context<SessionEnv>): Promise<Response> {
    const context = await requireSession(c);

    return c.json({
      user: context.user,
      workspace: context.workspace,
      hasProject: context.hasProject,
      providers: { enabled: this.service.providersForDeployment() },
    });
  }
}
