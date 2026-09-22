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
import type { EmailService } from "../../shared/email/email.service.js";
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

// A factory, not a module-level singleton, so the mail transport arrives through
// the composition root in `app.ts` like every other collaborator.
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
      // Kept in step with the "expires in 30 minutes" copy the dashboard shows.
      resetPasswordTokenExpiresIn: RESET_TOKEN_TTL_SECONDS,
      // Better Auth's `url` validates the token, then redirects to the dashboard
      // with `?token=…`. Rewriting it here would skip that exchange and hand the
      // reset page a token it cannot use, so it is forwarded untouched.
      sendResetPassword: async ({ user, url }) => {
        await emailService.sendPasswordReset({
          to: user.email,
          name: user.name,
          url,
          expiresInMinutes: RESET_TOKEN_TTL_SECONDS / 60,
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
