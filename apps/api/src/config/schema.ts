import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional();

export const ConfigSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // The dashboard assumes 4000.
    PORT: z.coerce.number().int().positive().default(4000),

    DATABASE_URL: z
      .string()
      .min(
        1,
        "DATABASE_URL is required — copy apps/api/.env.example to apps/api/.env.",
      ),

    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),

    REDIS_URL: optionalString,

    BETTER_AUTH_SECRET: z
      .string()
      .min(
        32,
        "BETTER_AUTH_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 32",
      ),

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

    BREVO_API_KEY: optionalString,
    EMAIL_FROM: optionalString,
    EMAIL_SENDER_NAME: z.string().trim().min(1).default("Dariise"),

    EMAIL_SANDBOX: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
  })
  // A mail transport needs both halves. Unlike a half-configured OAuth provider —
  // which only dims a button — a half-configured transport looks enabled while
  // every reset silently fails, so it is a startup error instead.
  .superRefine((value, ctx) => {
    if (value.BREVO_API_KEY === undefined && value.EMAIL_FROM === undefined) {
      return;
    }

    if (value.BREVO_API_KEY === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["BREVO_API_KEY"],
        message:
          "BREVO_API_KEY is required when EMAIL_FROM is set. Set both to enable email, or neither to leave it disabled.",
      });
    }

    if (value.EMAIL_FROM === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL_FROM"],
        message:
          "EMAIL_FROM is required when BREVO_API_KEY is set. Set both to enable email, or neither to leave it disabled.",
      });
      return;
    }

    if (!z.email().safeParse(value.EMAIL_FROM).success) {
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL_FROM"],
        message:
          "EMAIL_FROM must be an email address. Use a sender verified in your Brevo account.",
      });
    }
  })
  .transform((value) => ({
    nodeEnv: value.NODE_ENV,
    port: value.PORT,
    databaseUrl: value.DATABASE_URL,
    databasePoolMax: value.DATABASE_POOL_MAX,
    redisUrl: value.REDIS_URL,
    betterAuthSecret: value.BETTER_AUTH_SECRET,
    betterAuthUrl: value.BETTER_AUTH_URL,
    corsOrigins: value.CORS_ORIGINS,
    githubClientId: value.GITHUB_CLIENT_ID,
    githubClientSecret: value.GITHUB_CLIENT_SECRET,
    googleClientId: value.GOOGLE_CLIENT_ID,
    googleClientSecret: value.GOOGLE_CLIENT_SECRET,
    brevoApiKey: value.BREVO_API_KEY,
    emailFrom: value.EMAIL_FROM,
    emailSenderName: value.EMAIL_SENDER_NAME,
    emailSandbox: value.EMAIL_SANDBOX,
  }));
