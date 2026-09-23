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
import { env, isProduction } from "../../config/index.js";
import { enabledProviders } from "../../shared/constants.js";
import type { EmailService } from "../email/index.js";
import { RESET_TOKEN_TTL_SECONDS } from "./auth.types.js";

const socialProviders = {
  ...(enabledProviders.github
    ? {
        github: {
          clientId: env.githubClientId as string,
          clientSecret: env.githubClientSecret as string,
        },
      }
    : {}),
  ...(enabledProviders.google
    ? {
        google: {
          clientId: env.googleClientId as string,
          clientSecret: env.googleClientSecret as string,
        },
      }
    : {}),
};

export function createAuthConfig(emailService: EmailService) {
  return betterAuth({
    appName: "Dariise",
    baseURL: env.betterAuthUrl,
    basePath: "/api/auth",
    secret: env.betterAuthSecret,

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

    trustedOrigins: env.corsOrigins,

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: false,
      resetPasswordTokenExpiresIn: RESET_TOKEN_TTL_SECONDS,
      sendResetPassword: async ({ user, url }) => {
        await emailService.send({
          template: "passwordReset",
          to: user.email,
          toName: user.name,
          variables: {
            name: user.name,
            url,
            expiresInMinutes: RESET_TOKEN_TTL_SECONDS / 60,
          },
        });
      },
    },

    ...(Object.keys(socialProviders).length > 0 ? { socialProviders } : {}),

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      // Deliberately off: the cached cookie would keep serving the old name and
      // email for up to five minutes after PATCH /v1/me, and a profile screen
      // that appears to ignore a save is worse than one extra session read.
      cookieCache: {
        enabled: false,
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
}

export type Auth = ReturnType<typeof createAuthConfig>;
