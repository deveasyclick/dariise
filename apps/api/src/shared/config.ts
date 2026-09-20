import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv({ path: [".env.local", ".env"], quiet: true });

// Treat `""` as absent, so a copied `.env.example` does not look configured.
const optionalString = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // The dashboard assumes 4000.
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required — copy apps/api/.env.example to .env."),

  // Validated here so a typo ("ten") fails at startup instead of becoming a NaN
  // pool size at runtime. Keep instances x max below the server's max_connections.
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),

  // Accepted for parity with the documented environment, but unused until the
  // evaluation phase consumes the cache. See ADR-0002.
  REDIS_URL: optionalString,

  BETTER_AUTH_SECRET: z
    .string()
    .min(
      32,
      "BETTER_AUTH_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 32",
    ),

  // Must match how the browser addresses the API, or session cookies are issued
  // for the wrong host.
  BETTER_AUTH_URL: z.url().default("http://localhost:4000"),

  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  GITHUB_CLIENT_ID: optionalString,
  GITHUB_CLIENT_SECRET: optionalString,

  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";

// A provider needs both halves of its credential pair; a half-configured one is
// treated as absent so the API still boots. The dashboard reads this through
// `GET /v1/me` to dim the buttons it cannot honour.
export const enabledProviders = {
  github:
    env.GITHUB_CLIENT_ID !== undefined &&
    env.GITHUB_CLIENT_SECRET !== undefined,
  google:
    env.GOOGLE_CLIENT_ID !== undefined &&
    env.GOOGLE_CLIENT_SECRET !== undefined,
} as const;

export type OAuthProviderName = keyof typeof enabledProviders;
