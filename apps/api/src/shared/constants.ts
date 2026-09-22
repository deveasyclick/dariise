import { env } from "../config/index.js";

export const ERROR_CODE = {
  invalidRequest: "invalid_request",
  unauthorized: "unauthorized",
  forbidden: "forbidden",
  notFound: "not_found",
  conflict: "conflict",
  internalError: "internal_error",
} as const;

export const enabledProviders = {
  github:
    env.githubClientId !== undefined &&
    env.githubClientSecret !== undefined,
  google:
    env.googleClientId !== undefined &&
    env.googleClientSecret !== undefined,
} as const;

export type OAuthProviderName = keyof typeof enabledProviders;
