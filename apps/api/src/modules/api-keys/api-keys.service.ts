import { createHash, randomBytes, randomUUID } from "node:crypto";

import type {
  ApiKey,
  ApiKeyListQuery,
  CreateApiKeyInput,
  CreatedApiKey,
} from "@dariise/contracts";

import { writeAuditLog } from "../../db/audit.js";
import { db } from "../../db/client.js";
import { ApiError } from "../../shared/http/errors.js";
import { decodeCursor, toPage } from "../../shared/pagination.js";
import type { Page } from "../../shared/types/pagination.js";
import type { ProjectAccessService } from "../project-access/index.js";
import { toApiKey, toCreatedApiKey } from "./api-keys.mapper.js";
import type { ApiKeysRepository } from "./api-keys.repository.js";
import {
  API_KEY_PREFIX_BYTES,
  API_KEY_SECRET_BYTES,
  DEFAULT_API_KEY_KIND,
  type ApiKeyActorContext,
} from "./api-keys.types.js";

const MILLISECONDS_PER_DAY = 86_400_000;
const MAX_PREFIX_ATTEMPTS = 5;

/**
 * Listing is viewer-level; issuing and revoking a key is admin-level per the
 * ADR-0004 matrix. Only a hash of the secret is ever stored, and the secret
 * itself appears once, in the create response.
 */
export class ApiKeysService {
  constructor(
    private readonly repository: ApiKeysRepository,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async list(
    context: ApiKeyActorContext,
    projectKey: string,
    query: ApiKeyListQuery,
  ): Promise<Page<ApiKey>> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole: "viewer",
    });

    const rows = await this.repository.list(project.id, {
      includeRevoked: query.includeRevoked ?? false,
      limit: query.limit,
      cursor: decodeCursor(query.cursor),
    });

    const page = toPage(rows, query.limit, (row) => row.prefix);

    return {
      data: page.data.map(toApiKey),
      nextCursor: page.nextCursor,
    };
  }

  async create(
    context: ApiKeyActorContext,
    projectKey: string,
    input: CreateApiKeyInput,
  ): Promise<CreatedApiKey> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole: "admin",
    });

    let environmentId: string | null = null;

    if (input.environmentKey) {
      const environment = await this.repository.findEnvironmentByKey(
        project.id,
        input.environmentKey,
      );

      if (!environment) {
        throw ApiError.badRequest(
          `"${input.environmentKey}" is not an environment of this project.`,
        );
      }

      environmentId = environment.id;
    }

    const { prefix, secret } = await this.allocate();
    const id = randomUUID();
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * MILLISECONDS_PER_DAY)
      : null;

    await db.transaction(async (tx) => {
      await this.repository.insert(tx, {
        id,
        projectId: project.id,
        environmentId,
        kind: DEFAULT_API_KEY_KIND,
        name: input.name,
        prefix,
        secretHash: this.hashSecret(secret),
        scopes: input.scopes,
        expiresAt,
      });

      await writeAuditLog(tx, {
        organizationId: context.organizationId,
        projectId: project.id,
        environmentId,
        actor: context.userId,
        action: "api_key.created",
        target: id,
        // Never the secret, and never the hash.
        changes: {
          name: input.name,
          prefix,
          scopes: input.scopes,
          environmentKey: input.environmentKey ?? null,
          expiresAt: expiresAt?.toISOString() ?? null,
        },
      });
    });

    const row = await this.requireKey(project.id, id);

    return toCreatedApiKey(row, secret);
  }

  /** Idempotent: revoking an already-revoked key changes nothing and adds no audit row. */
  async revoke(
    context: ApiKeyActorContext,
    projectKey: string,
    keyId: string,
  ): Promise<ApiKey> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole: "admin",
    });

    const row = await this.requireKey(project.id, keyId);

    if (row.revokedAt) {
      return toApiKey(row);
    }

    await db.transaction(async (tx) => {
      await this.repository.revoke(tx, row.id);

      await writeAuditLog(tx, {
        organizationId: context.organizationId,
        projectId: project.id,
        environmentId: row.environmentId,
        actor: context.userId,
        action: "api_key.revoked",
        target: row.id,
        changes: { prefix: row.prefix },
      });
    });

    return toApiKey(await this.requireKey(project.id, keyId));
  }

  private async allocate(): Promise<{ prefix: string; secret: string }> {
    for (let attempt = 0; attempt < MAX_PREFIX_ATTEMPTS; attempt += 1) {
      const prefix = `ff_${randomBytes(API_KEY_PREFIX_BYTES).toString("hex")}`;

      if (!(await this.repository.prefixExists(prefix))) {
        return {
          prefix,
          secret: `${prefix}_${randomBytes(API_KEY_SECRET_BYTES).toString("base64url")}`,
        };
      }
    }

    throw ApiError.conflict(
      "Could not allocate a unique key prefix. Please try again.",
    );
  }

  private hashSecret(secret: string): string {
    return createHash("sha256").update(secret).digest("hex");
  }

  private async requireKey(projectId: string, id: string) {
    const row = await this.repository.findById(projectId, id);

    if (!row) {
      throw ApiError.notFound("API key not found.");
    }

    return row;
  }
}
