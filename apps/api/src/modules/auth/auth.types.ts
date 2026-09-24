import type { Auth } from "./auth.config.js";

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

// Injected so onboarding state can be reported without the auth module importing
// the projects module; wired in `app.ts`.
export type ProjectExistenceChecker = (
  organizationId: string,
) => Promise<boolean>;

// Both are passed in through the composition root, which owns the auth instance,
// rather than imported here — that keeps the module free of a value-level import
// of its own config.
export type AuthHandler = Auth["handler"];

export type GetSession = Auth["api"]["getSession"];

/**
 * The credential operations Better Auth owns. Wrapped here so the account
 * module never touches the auth instance or re-implements password hashing.
 */
export interface AuthCredentialApi {
  updateUser: Auth["api"]["updateUser"];
  changePassword: Auth["api"]["changePassword"];
}

// How long a confirmation or reset code stays usable. Long enough to survive a
// greylisting delay, short enough that a code left in an old inbox is not a
// standing claim on the address.
export const VERIFICATION_CODE_TTL_SECONDS = 10 * 60;
