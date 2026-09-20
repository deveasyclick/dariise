import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { organization as organizationPlugin } from "better-auth/plugins";

import { db } from "../../db/client.js";
import {
  account,
  invitation,
  member,
  organization,
  session,
  user,
  verification,
} from "../../db/schema/index.js";
import { env, isProduction, enabledProviders } from "../../shared/config.js";

const socialProviders = {
  ...(enabledProviders.github
    ? {
        github: {
          clientId: env.GITHUB_CLIENT_ID as string,
          clientSecret: env.GITHUB_CLIENT_SECRET as string,
        },
      }
    : {}),
  ...(enabledProviders.google
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID as string,
          clientSecret: env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : {}),
};

export const auth = betterAuth({
  appName: "Dariise",
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
      organization,
      member,
      invitation,
    },
    usePlural: false,
  }),

  trustedOrigins: env.CORS_ORIGINS,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,
    // TODO: add email transport
    sendResetPassword: async ({ user, url, token }) => {
      const webOrigin = env.CORS_ORIGINS[0] ?? env.BETTER_AUTH_URL;
      const link = `${webOrigin}/reset-password?token=${encodeURIComponent(token)}`;

      if (isProduction) {
        console.warn(
          `[auth] password reset requested for ${user.email}, but no mail transport is configured — the link was not delivered`,
        );
        return;
      }

      console.info(
        [
          "",
          "  ── password reset ─────────────────────────────────────────",
          `  to:   ${user.email}`,
          `  link: ${link}`,
          "  ────────────────────────────────────────────────────────────",
          "",
        ].join("\n"),
      );
    },
  },

  ...(Object.keys(socialProviders).length > 0 ? { socialProviders } : {}),

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: isProduction,
      httpOnly: true,
    },
  },

  plugins: [organizationPlugin()],
});

export type Auth = typeof auth;
