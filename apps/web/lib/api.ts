import { API_URL } from "@/lib/env";
import type {
  ApiKey,
  ApiKeyScope,
  AuditLogEntry,
  Environment,
  EvaluationResult,
  EvaluationUserContext,
  FeatureFlag,
  Project,
  Segment,
} from "@/lib/types";

/**
 * Thin typed client for the Dariise API. It intentionally has no data-fetching
 * framework attached: Server Components call the resource functions directly,
 * and Client Components can call them for mutations.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Query parameters are stringified before being sent, so any serialisable
 * value is accepted. `undefined` and `null` entries are dropped.
 */
export type QueryParams = Record<string, unknown>;

export interface RequestOptions {
  /**
   * Seconds a Server Component may reuse the response for. Omit to opt out of
   * caching, which is the right default for configuration that changes.
   */
  revalidate?: number;
  /** Set for non-GET requests. */
  body?: unknown;
  signal?: AbortSignal;
  /** Extra headers, e.g. a management API key for mutations. */
  headers?: Record<string, string>;
}

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

function buildUrl(path: string, query?: QueryParams): string {
  const url = new URL(`${API_URL}${path}`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function errorMessage(payload: unknown, status: number): string {
  if (typeof payload === "string" && payload.trim()) return payload;

  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    // FastAPI validation errors arrive as a list of {loc, msg, type}.
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) =>
          item && typeof item === "object" && "msg" in item
            ? String((item as { msg: unknown }).msg)
            : null,
        )
        .filter((message): message is string => Boolean(message));

      if (messages.length > 0) return messages.join("; ");
    }
  }

  return `Dariise API request failed with status ${status}`;
}

/**
 * Perform a request against the Dariise API and parse the JSON response.
 *
 * @throws {ApiError} when the API responds with a non-2xx status.
 */
export async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions & { query?: QueryParams } = {},
): Promise<T> {
  const { query, body, revalidate, signal, headers } = options;

  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      ...(revalidate === undefined ? { cache: "no-store" as const } : { next: { revalidate } }),
    });
  } catch (cause) {
    throw new ApiError(
      `Could not reach the Dariise API at ${API_URL}.`,
      0,
      cause,
    );
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(errorMessage(payload, response.status), response.status, payload);
  }

  return payload as T;
}

export type FlagListFilters = QueryParams & {
  /** Case-insensitive match on flag key or name. */
  search?: string;
  status?: FeatureFlag["status"];
};

export const projects = {
  list: (options?: RequestOptions) => request<Project[]>("GET", "/v1/projects", options),
  get: (projectId: string, options?: RequestOptions) =>
    request<Project>("GET", `/v1/projects/${projectId}`, options),
};

export const environments = {
  list: (projectId: string, options?: RequestOptions) =>
    request<Environment[]>("GET", `/v1/projects/${projectId}/environments`, options),
  get: (projectId: string, environmentId: string, options?: RequestOptions) =>
    request<Environment>(
      "GET",
      `/v1/projects/${projectId}/environments/${environmentId}`,
      options,
    ),
};

export const flags = {
  list: (
    projectId: string,
    environmentId: string,
    filters: FlagListFilters = {},
    options?: RequestOptions,
  ) =>
    request<FeatureFlag[]>(
      "GET",
      `/v1/projects/${projectId}/environments/${environmentId}/flags`,
      { ...options, query: filters },
    ),

  get: (
    projectId: string,
    environmentId: string,
    flagKey: string,
    options?: RequestOptions,
  ) =>
    request<FeatureFlag>(
      "GET",
      `/v1/projects/${projectId}/environments/${environmentId}/flags/${flagKey}`,
      options,
    ),

  create: (
    projectId: string,
    environmentId: string,
    input: Pick<FeatureFlag, "key" | "name"> &
      Partial<Pick<FeatureFlag, "description" | "defaultVariation">>,
    options?: RequestOptions,
  ) =>
    request<FeatureFlag>(
      "POST",
      `/v1/projects/${projectId}/environments/${environmentId}/flags`,
      { ...options, body: input },
    ),

  update: (
    projectId: string,
    environmentId: string,
    flagKey: string,
    input: Partial<FeatureFlag>,
    options?: RequestOptions,
  ) =>
    request<FeatureFlag>(
      "PATCH",
      `/v1/projects/${projectId}/environments/${environmentId}/flags/${flagKey}`,
      { ...options, body: input },
    ),
};

export const segments = {
  list: (projectId: string, options?: RequestOptions) =>
    request<Segment[]>("GET", `/v1/projects/${projectId}/segments`, options),
};

export interface CreateApiKeyBody {
  name: string;
  /** `null` issues a key that is valid in every environment. */
  environmentId: string | null;
  scopes: ApiKeyScope[];
  /** `null` issues a key that never expires. */
  expiresInDays: number | null;
}

export const apiKeys = {
  list: (projectId: string, options?: RequestOptions) =>
    request<ApiKey[]>("GET", `/v1/projects/${projectId}/api-keys`, options),

  /**
   * Issue a key.
   *
   * This is the only response that carries `secret`; the dashboard shows it
   * once and never asks for it again.
   */
  create: (
    projectId: string,
    input: CreateApiKeyBody,
    options?: RequestOptions,
  ) =>
    request<ApiKey & { secret: string }>(
      "POST",
      `/v1/projects/${projectId}/api-keys`,
      { ...options, body: input },
    ),

  revoke: (projectId: string, keyId: string, options?: RequestOptions) =>
    request<void>(
      "DELETE",
      `/v1/projects/${projectId}/api-keys/${keyId}`,
      options,
    ),
};

export const audit = {
  list: (
    projectId: string,
    filters: { environmentId?: string; limit?: number } = {},
    options?: RequestOptions,
  ) =>
    request<AuditLogEntry[]>("GET", `/v1/projects/${projectId}/audit-logs`, {
      ...options,
      query: filters,
    }),
};

/**
 * Evaluate a flag for a user.
 *
 * This is the same contract the Dariise SDK uses; the dashboard calls it to
 * debug why a user received a particular variation.
 */
export function evaluate(
  input: {
    flag: string;
    environment: string;
    user: EvaluationUserContext;
  },
  options?: RequestOptions,
): Promise<EvaluationResult> {
  return request<EvaluationResult>("POST", "/v1/evaluate", {
    ...options,
    body: input,
  });
}
