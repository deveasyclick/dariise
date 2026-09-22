import { z } from "zod";

import { environmentKeySchema } from "#environment";
import { paginationQuerySchema } from "#pagination";

export const API_KEY_SCOPES = [
  "flags:read",
  "flags:write",
  "segments:read",
  "webhooks:manage",
] as const;

export const apiKeyScopeSchema = z.enum(API_KEY_SCOPES);

export type ApiKeyScope = z.infer<typeof apiKeyScopeSchema>;

export const API_KEY_KINDS = ["management", "server", "client"] as const;

export const apiKeyKindSchema = z.enum(API_KEY_KINDS);

export type ApiKeyKind = z.infer<typeof apiKeyKindSchema>;

/**
 * Key metadata as the dashboard lists it. The secret is deliberately absent;
 * it appears once, in the create response, and only its hash is stored.
 */
export const apiKeySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  /** `null` when the key is valid in every environment. */
  environmentId: z.string().nullable(),
  environmentKey: z.string().nullable(),
  kind: apiKeyKindSchema,
  name: z.string(),
  scopes: z.array(apiKeyScopeSchema),
  /** Non-secret identifier shown in the dashboard, e.g. `ff_prod_8a2c`. */
  prefix: z.string(),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
});

export type ApiKey = z.infer<typeof apiKeySchema>;

export const createApiKeySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Key name is required.")
    .max(80, "Key name must be at most 80 characters."),
  /** The environment key, not its id; `null` means every environment. */
  environmentKey: environmentKeySchema.nullable().optional(),
  scopes: z
    .array(apiKeyScopeSchema)
    .min(1, "Choose at least one scope.")
    .max(API_KEY_SCOPES.length),
  /** `null` issues a key that never expires. */
  expiresInDays: z
    .number()
    .int()
    .positive("Expiry must be at least one day.")
    .nullable()
    .optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

/** The create response, and the only place `secret` is ever returned. */
export const createdApiKeySchema = apiKeySchema.extend({
  secret: z.string(),
});

export type CreatedApiKey = z.infer<typeof createdApiKeySchema>;

export const apiKeyListQuerySchema = paginationQuerySchema.extend({
  includeRevoked: z.coerce.boolean().optional(),
});

export type ApiKeyListQuery = z.infer<typeof apiKeyListQuerySchema>;
