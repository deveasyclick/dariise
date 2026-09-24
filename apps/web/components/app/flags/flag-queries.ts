import { notFound } from "next/navigation";

import {
  MAX_PAGE_SIZE,
  type FlagDetail,
  type FlagEnvironmentConfig,
  type FlagVersion,
  type WorkspaceFlagSummary,
} from "@dariise/contracts";

import { ApiError, flags as flagsApi } from "@/lib/api";
import { getScope } from "@/lib/scope";

export interface FlagScope {
  projectKey: string;
  environmentKey: string;
  environmentName: string;
}

export async function requireFlagScope(): Promise<FlagScope> {
  const { project, environment } = await getScope();

  if (!project || !environment) notFound();

  return {
    projectKey: project.key,
    environmentKey: environment.key,
    environmentName: environment.name,
  };
}

export async function loadFlagDetail(
  projectKey: string,
  flagKey: string,
): Promise<FlagDetail> {
  try {
    return await flagsApi.get(projectKey, flagKey);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export function environmentConfig(
  detail: FlagDetail,
  environmentKey: string,
): FlagEnvironmentConfig {
  const config = detail.environments.find(
    (entry) => entry.environmentKey === environmentKey,
  );

  if (!config) notFound();

  return config;
}

export async function listWorkspaceFlags(): Promise<WorkspaceFlagSummary[]> {
  const collected: WorkspaceFlagSummary[] = [];
  let cursor: string | undefined;

  do {
    const page = await flagsApi.listWorkspace({ limit: MAX_PAGE_SIZE, cursor });

    collected.push(...page.data);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  return collected;
}

/** Every version of one flag, oldest page first. */
export async function listFlagVersions(
  projectKey: string,
  flagKey: string,
): Promise<FlagVersion[]> {
  const collected: FlagVersion[] = [];
  let cursor: string | undefined;

  do {
    const page = await flagsApi.versions(projectKey, flagKey, {
      limit: MAX_PAGE_SIZE,
      cursor,
    });

    collected.push(...page.data);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  return collected;
}
