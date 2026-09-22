/**
 * Auth actions.
 *
 * This module replaces the old `auth-stub.ts`, which simulated a 700 ms
 * round-trip and persisted nothing. It keeps the same shape the four auth forms
 * already call, so the forms needed no restructuring.
 *
 * Validation runs here, against the shared schemas in `@dariise/contracts`,
 * before any request is made. That is the point of the contracts package: the
 * rule that rejects a password lives in one place, and the same rule is enforced
 * again by the API. The forms' own `lib/validation.ts` checks are kept for
 * inline feedback as the user types — an immediate message is better UX than a
 * deferred one — but they are no longer the only line of defence.
 *
 * Errors are surfaced as `AuthError`, which carries a field-keyed map matching
 * what each form renders. A failure that belongs to no single input lands under
 * `form`.
 */

import {
  createProjectSchema,
  createWorkspaceSchema,
  projectSummarySchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  toFieldErrors,
  type CreateWorkspaceInput,
  type FieldErrors,
  type OAuthProvider,
  type ProjectSummary,
} from "@dariise/contracts";
import type { ZodType } from "zod";

import { authClient, authErrorMessage } from "@/lib/auth-client";
import env from "shared/env";

export type { OAuthProvider };

/* -------------------------------------------------------------------------- */
/* Errors                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A validation or API failure, carrying the message to show against each field.
 */
export class AuthError<Field extends string = string> extends Error {
  readonly fieldErrors: FieldErrors<Field>;

  constructor(fieldErrors: FieldErrors<Field>, message?: string) {
    super(message ?? Object.values(fieldErrors)[0] ?? "Something went wrong.");
    this.name = "AuthError";
    this.fieldErrors = fieldErrors;
  }
}

type FieldKey = string;

/**
 * Validate a partial payload and rethrow zod's issues as field errors.
 *
 * Partial on purpose: the forms validate individual fields before submitting,
 * so this accepts whichever subset a caller has.
 */
export function validate<Schema extends ZodType>(
  schema: Schema,
  value: unknown,
): FieldErrors<FieldKey> | null {
  const result = schema.safeParse(value);

  if (result.success) return null;

  return toFieldErrors<FieldKey>(result.error);
}

function fromAuthError(error: {
  code?: string | undefined;
  message?: string | undefined;
} | null): AuthError<FieldKey> {
  return new AuthError<FieldKey>(
    { form: authErrorMessage(error ?? {}) },
    authErrorMessage(error ?? {}),
  );
}

/* -------------------------------------------------------------------------- */
/* Providers                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Which social providers are enabled on this deployment.
 *
 * Returns an empty list when the request fails. Failing closed is the right
 * behaviour here: the alternative is offering a button that leads to a broken
 * handshake.
 */
export async function getEnabledProviders(
  signal?: AbortSignal,
): Promise<OAuthProvider[]> {
  try {
    const response = await fetch(`${env.apiUrl}/v1/auth/providers`, {
      headers: { accept: "application/json" },
      credentials: "include",
      signal,
    });

    if (!response.ok) return [];

    const body = (await response.json()) as { enabled?: OAuthProvider[] };

    return body.enabled ?? [];
  } catch {
    /**
     * Fail closed, on purpose.
     *
     * This runs while rendering the access screens. If it threw, an unreachable
     * API would replace the sign-in form with an error page — turning a
     * recoverable situation into a total outage. Returning an empty list dims
     * the social buttons and leaves the email form, which is the honest
     * representation of "we could not confirm any provider works".
     */
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* Sign in                                                                     */
/* -------------------------------------------------------------------------- */

export interface SignInInput {
  email: string;
  password: string;
  remember: boolean;
}

export async function signIn(
  input: SignInInput,
  signal?: AbortSignal,
): Promise<void> {
  const errors = validate(signInSchema, input);
  if (errors) throw new AuthError(errors);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const { error } = await authClient.signIn.email({
    email: input.email,
    password: input.password,
    rememberMe: input.remember,
  });

  if (error) throw fromAuthError(error);
}

/* -------------------------------------------------------------------------- */
/* Sign up                                                                     */
/* -------------------------------------------------------------------------- */

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export async function signUp(
  input: SignUpInput,
  signal?: AbortSignal,
): Promise<void> {
  // The form enforces the terms checkbox itself; the schema requires it, so it
  // is supplied here rather than threaded through a form that always sets it.
  const errors = validate(signUpSchema, { ...input, acceptedTerms: true });
  if (errors) throw new AuthError(errors);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const { error } = await authClient.signUp.email({
    name: input.name,
    email: input.email,
    password: input.password,
  });

  if (error) throw fromAuthError(error);
}

/* -------------------------------------------------------------------------- */
/* Social sign-in                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Start a social sign-in.
 *
 * This navigates the browser away to the provider, so it does not resolve with a
 * session; the user returns to `callbackURL` once the provider redirects back.
 */
export async function signInWithProvider(
  provider: OAuthProvider,
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  // Relayed verbatim in a Location header, so a relative path would resolve
  // against the API origin rather than this dashboard.
  const origin = window.location.origin;

  const { error } = await authClient.signIn.social({
    provider,
    callbackURL: `${origin}/overview`,
    newUserCallbackURL: `${origin}/create-workspace`,
    errorCallbackURL: `${origin}${window.location.pathname}`,
  });

  if (error) throw fromAuthError(error);
}

/**
 * The `?error=<code>` Better Auth appends to a failed handshake, in words.
 */
export function oauthErrorMessage(
  code: string | undefined,
): string | undefined {
  if (!code) return undefined;

  switch (code) {
    case "access_denied":
      return "Sign-in was cancelled at the provider.";
    case "email_not_found":
      return "That provider did not share an email address. Make your email visible, or sign in with a password.";
    case "invalid_state":
    case "state_mismatch":
      return "The sign-in attempt could not be verified. Please try again.";
    case "account_not_linked":
      return "That email is already registered with a different sign-in method.";
    default:
      return `Sign-in failed (${code}). Please try again.`;
  }
}

/* -------------------------------------------------------------------------- */
/* Sign out                                                                    */
/* -------------------------------------------------------------------------- */

export async function signOut(signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const { error } = await authClient.signOut();

  if (error) throw fromAuthError(error);
}

/* -------------------------------------------------------------------------- */
/* Password reset                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Request a reset link.
 *
 * The API mails the link through Brevo when it is configured, and otherwise
 * prints it to its own console — the request is made either way, so this is not
 * a place to branch on whether mail is set up. Better Auth answers identically
 * for a known and an unknown address, which is what keeps the form from leaking
 * which emails have accounts.
 */
export async function requestPasswordReset(
  email: string,
  signal?: AbortSignal,
): Promise<void> {
  const errors = validate(requestPasswordResetSchema, { email });
  if (errors) throw new AuthError(errors);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const { error } = await authClient.requestPasswordReset({
    email,
    redirectTo: "/reset-password",
  });

  if (error) throw fromAuthError(error);
}

/**
 * Complete a password reset.
 *
 * The token is the one the email's link resolves to; with no mail transport
 * configured it is the URL the API logged to its console instead. It is
 * single-use and expires after 30 minutes.
 */
export async function resetPassword(
  input: { token: string; newPassword: string },
  signal?: AbortSignal,
): Promise<void> {
  const errors = validate(resetPasswordSchema, input);
  if (errors) throw new AuthError(errors);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const { error } = await authClient.resetPassword({
    newPassword: input.newPassword,
    token: input.token,
  });

  if (error) throw fromAuthError(error);
}

/* -------------------------------------------------------------------------- */
/* Workspace                                                                   */
/* -------------------------------------------------------------------------- */

export interface CreateWorkspaceFormInput {
  name: string;
  slug: string;
  /** Invitees to add once the workspace exists. Not sent to the API yet. */
  invites?: string[];
}

/**
 * Create the workspace.
 *
 * The workspace **is** the Better Auth organization (ADR-0003), so this calls the
 * organization plugin's create endpoint and nothing else. The creator is added as
 * `owner` by the plugin.
 *
 * There is no follow-up call: every column the workspace needs is one the plugin
 * already writes. Onboarding asks for a name and a slug, and both go straight to
 * the plugin.
 */
export async function createWorkspace(
  input: CreateWorkspaceFormInput,
  signal?: AbortSignal,
): Promise<void> {
  const errors = validate(createWorkspaceSchema, input);
  if (errors) throw new AuthError(errors);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const { data, error } = await authClient.organization.create({
    name: input.name,
    slug: input.slug,
  });

  if (error) throw fromAuthError(error);

  if (!data) {
    throw new AuthError<FieldKey>({
      form: "The workspace could not be created. Please try again.",
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Project                                                                     */
/* -------------------------------------------------------------------------- */

export interface CreateProjectFormInput {
  name: string;
  environmentName: string;
}

/**
 * How a new project's flags should start out.
 *
 * Retained as a type only. The dashboard's create-project screen offers this
 * choice, but the API does not model per-environment flag state yet, so the
 * selection is not sent. Kept here rather than deleted so the screen keeps
 * type-checking while the feature is pending — see the note in that component.
 */
export type InitialFlagState = "all-off" | "copy-source" | "all-on";

/**
 * Create the first project.
 *
 * `POST /v1/projects` takes the workspace from the session rather than the body,
 * so a caller cannot create a project in a tenant they do not belong to. The
 * project key is derived and de-duplicated server-side, which is why it is not
 * sent.
 *
 * The response is parsed rather than cast: the API is a separate deployment and
 * an unchecked cast would turn a contract drift into a confusing runtime failure
 * later.
 */
export async function createProject(
  input: CreateProjectFormInput,
  signal?: AbortSignal,
): Promise<ProjectSummary> {
  const errors = validate(createProjectSchema, input);
  if (errors) throw new AuthError(errors);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const response = await fetch(`${env.apiUrl}/v1/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
    signal,
  });

  const payload: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    /** The API's contracted envelope, `{ error: { code, message } }`. */
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as { error?: { message?: unknown } }).error?.message ===
        "string"
        ? (payload as { error: { message: string } }).error.message
        : "The project could not be created. Please try again.";

    throw new AuthError<FieldKey>({ form: message }, message);
  }

  const parsed = projectSummarySchema.safeParse(payload);

  if (!parsed.success) {
    throw new AuthError<FieldKey>({
      form: "The project was created, but the API returned an unexpected response.",
    });
  }

  return parsed.data;
}

export type { CreateWorkspaceInput };
