"use server";

/**
 * The chrome's scope switchers.
 *
 * The selected project and environment are request-scoped presentation state,
 * not server state: they decide which project's flags a screen loads and are
 * meaningless to the API, which always takes the project key explicitly. A
 * cookie is therefore the right home for them — it survives navigation and
 * reloads without a round trip or a second source of truth.
 */

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import env from "shared/env";

import { ENVIRONMENT_COOKIE, PROJECT_COOKIE } from "@/lib/scope";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function cookieOptions() {
  return {
    path: "/",
    sameSite: "lax" as const,
    httpOnly: true,
    secure: env.environment === "production",
    maxAge: ONE_YEAR_SECONDS,
  };
}

/** Scope every screen to a project. */
export async function selectProject(projectKey: string): Promise<void> {
  const jar = await cookies();

  jar.set(PROJECT_COOKIE, projectKey, cookieOptions());

  // The environment belongs to the project it was chosen in, so the previous
  // selection is dropped and `getScope` falls back to the new project's default.
  jar.delete(ENVIRONMENT_COOKIE);

  revalidatePath("/", "layout");
}

/** Scope every screen to an environment within the current project. */
export async function selectEnvironment(environmentKey: string): Promise<void> {
  const jar = await cookies();

  jar.set(ENVIRONMENT_COOKIE, environmentKey, cookieOptions());

  revalidatePath("/", "layout");
}
