import { cache } from "react";
import { notFound } from "next/navigation";

import {
  MAX_PAGE_SIZE,
  type FlagChangeRequest,
  type FlagDetail,
  type FlagSummary,
  type FlagVersion,
  type WorkspaceFlagSummary,
} from "@dariise/contracts";

import {
  ApiError,
  changeRequests as changeRequestsApi,
  flags as flagsApi,
} from "@/lib/api";
import { getScope, listEnvironments } from "@/lib/scope";

export interface FlagScope {
  projectKey: string;
  environmentKey: string;
  environmentName: string;
  /** A protected environment refuses direct publishes; the screens propose instead. */
  protectedEnvironment: boolean;
}

/**
 * Resolve one environment of the selected project, from the route rather than
 * the cookie, so a flag URL names the environment it belongs to.
 */
export const requireFlagScope = cache(
  async (environmentKey: string): Promise<FlagScope> => {
    const { project } = await getScope();

    if (!project) notFound();

    const environments = await listEnvironments(project.key, {
      includeArchived: true,
    });
    const environment = environments.find((entry) => entry.key === environmentKey);

    if (!environment) notFound();

    return {
      projectKey: project.key,
      environmentKey: environment.key,
      environmentName: environment.name,
      protectedEnvironment: environment.isProtected,
    };
  },
);

/** The environments one flag can be promoted into: the project's others. */
export interface PromotionTarget {
  key: string;
  name: string;
  isProtected: boolean;
}

export async function listPromotionTargets(
  projectKey: string,
  environmentKey: string,
): Promise<PromotionTarget[]> {
  const environments = await listEnvironments(projectKey);

  return environments
    .filter((environment) => environment.key !== environmentKey)
    .map((environment) => ({
      key: environment.key,
      name: environment.name,
      isProtected: environment.isProtected,
    }));
}

/**
 * The pending proposal for one flag in one environment, if there is one.
 *
 * At most one can be pending — a newer proposal supersedes the older — so the
 * screens render a single piece of approval state rather than a queue.
 */
export async function loadPendingChangeRequest(
  projectKey: string,
  flagKey: string,
  environmentKey: string,
): Promise<FlagChangeRequest | null> {
  const page = await changeRequestsApi.list(projectKey, flagKey, {
    environmentKey,
    status: "pending",
    limit: 1,
  });

  return page.data[0] ?? null;
}

export async function loadFlagDetail(
  projectKey: string,
  environmentKey: string,
  flagKey: string,
): Promise<FlagDetail> {
  try {
    return await flagsApi.get(projectKey, environmentKey, flagKey);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

/** Every flag one project holds in one environment. */
export async function listEnvironmentFlags(
  projectKey: string,
  environmentKey: string,
): Promise<FlagSummary[]> {
  const collected: FlagSummary[] = [];
  let cursor: string | undefined;

  do {
    const page = await flagsApi.list(projectKey, {
      environmentKey,
      limit: MAX_PAGE_SIZE,
      cursor,
    });

    collected.push(...page.data);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  return collected;
}

/** Every project's flags, for the workspace-wide project list. */
export async function listWorkspaceFlags(): Promise<WorkspaceFlagSummary[]> {
  const collected: WorkspaceFlagSummary[] = [];
  let cursor: string | undefined;

  do {
    const page = await flagsApi.listWorkspace({
      limit: MAX_PAGE_SIZE,
      cursor,
    });

    collected.push(...page.data);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  return collected;
}

/** Every version of one flag, oldest page first. */
export async function listFlagVersions(
  projectKey: string,
  flagKey: string,
  environmentKey: string,
): Promise<FlagVersion[]> {
  const collected: FlagVersion[] = [];
  let cursor: string | undefined;

  do {
    const page = await flagsApi.versions(projectKey, flagKey, environmentKey, {
      limit: MAX_PAGE_SIZE,
      cursor,
    });

    collected.push(...page.data);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  return collected;
}
