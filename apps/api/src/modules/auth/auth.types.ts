export interface RequestUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
}

export interface WorkspaceMembership {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface RequestContext {
  user: RequestUser;
  session: {
    id: string;
    activeOrganizationId?: string | null;
  };
  workspace: WorkspaceMembership | null;
  hasProject: boolean;
}

export type SessionEnv = {
  Variables: {
    session: RequestContext | null;
  };
};

/**
 * Injected into `AuthService` so onboarding state can be reported without the
 * auth module importing the projects module. Wired in `app.ts`.
 */
export type ProjectExistenceChecker = (
  organizationId: string,
) => Promise<boolean>;
