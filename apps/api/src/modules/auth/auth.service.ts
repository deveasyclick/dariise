import { enabledProviders } from "../../shared/config.js";
import { auth } from "./auth.config.js";
import type { AuthRepository } from "./auth.repository.js";
import type {
  ProjectExistenceChecker,
  RequestContext,
} from "./auth.types.js";

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly projectExists: ProjectExistenceChecker,
  ) {}

  async resolveRequestContext(
    headers: Headers,
  ): Promise<RequestContext | null> {
    const result = await auth.api.getSession({ headers });

    if (!result) return null;

    const workspace = await this.repository.findWorkspaceForUser(
      result.user.id,
    );
    const projectExists = workspace
      ? await this.projectExists(workspace.id)
      : false;

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        image: result.user.image,
        emailVerified: result.user.emailVerified,
      },
      session: {
        id: result.session.id,
        activeOrganizationId: result.session.activeOrganizationId,
      },
      workspace,
      hasProject: projectExists,
    };
  }

  providersForDeployment(): Array<"github" | "google"> {
    return (
      Object.keys(enabledProviders) as Array<keyof typeof enabledProviders>
    ).filter((provider) => enabledProviders[provider]);
  }
}

export const authHandler = auth.handler;
