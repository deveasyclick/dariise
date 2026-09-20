import { z } from "zod";

export const OAUTH_PROVIDERS = ["github", "google"] as const;

export const oauthProviderSchema = z.enum(OAUTH_PROVIDERS);

export type OAuthProvider = z.infer<typeof oauthProviderSchema>;

/**
 * `GET /v1/auth/providers`.
 *
 * A provider whose credentials are absent is reported as disabled so the
 * dashboard dims its button instead of starting a handshake that cannot finish.
 */
export const enabledProvidersSchema = z.object({
  enabled: z.array(oauthProviderSchema),
});

export type EnabledProviders = z.infer<typeof enabledProvidersSchema>;
