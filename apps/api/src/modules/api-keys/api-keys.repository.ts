import { and, asc, eq, gt, isNull } from "drizzle-orm";

import { db } from "../../db/client.js";
import { apiKey, environment } from "../../db/schema/index.js";
import type { Transaction } from "../../shared/types/db.js";
import type {
  ApiKeyListFilter,
  ApiKeyRow,
  EnvironmentRef,
  NewApiKeyRecord,
} from "./api-keys.types.js";

const keyColumns = {
  id: apiKey.id,
  projectId: apiKey.projectId,
  environmentId: apiKey.environmentId,
  environmentKey: environment.key,
  kind: apiKey.kind,
  name: apiKey.name,
  prefix: apiKey.prefix,
  scopes: apiKey.scopes,
  createdAt: apiKey.createdAt,
  lastUsedAt: apiKey.lastUsedAt,
  expiresAt: apiKey.expiresAt,
  revokedAt: apiKey.revokedAt,
};

export class ApiKeysRepository {
  /** Fetches limit + 1 rows so the caller can tell whether another page exists. */
  async list(
    projectId: string,
    filter: ApiKeyListFilter,
  ): Promise<ApiKeyRow[]> {
    const conditions = [eq(apiKey.projectId, projectId)];

    if (!filter.includeRevoked) {
      conditions.push(isNull(apiKey.revokedAt));
    }

    if (filter.cursor) {
      conditions.push(gt(apiKey.prefix, filter.cursor));
    }

    return db
      .select(keyColumns)
      .from(apiKey)
      .leftJoin(environment, eq(environment.id, apiKey.environmentId))
      .where(and(...conditions))
      .orderBy(asc(apiKey.prefix))
      .limit(filter.limit + 1);
  }

  async findById(projectId: string, id: string): Promise<ApiKeyRow | null> {
    const rows = await db
      .select(keyColumns)
      .from(apiKey)
      .leftJoin(environment, eq(environment.id, apiKey.environmentId))
      .where(and(eq(apiKey.projectId, projectId), eq(apiKey.id, id)))
      .limit(1);

    return rows[0] ?? null;
  }

  /**
   * Resolves an environment key inside the project. The `environment` table is
   * reached from `db/schema` like every other table, so this stays a plain
   * foreign-key lookup rather than a second module dependency.
   */
  async findEnvironmentByKey(
    projectId: string,
    key: string,
  ): Promise<EnvironmentRef | null> {
    const rows = await db
      .select({ id: environment.id, key: environment.key })
      .from(environment)
      .where(
        and(eq(environment.projectId, projectId), eq(environment.key, key)),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async prefixExists(prefix: string): Promise<boolean> {
    const rows = await db
      .select({ id: apiKey.id })
      .from(apiKey)
      .where(eq(apiKey.prefix, prefix))
      .limit(1);

    return rows.length > 0;
  }

  async insert(tx: Transaction, record: NewApiKeyRecord): Promise<void> {
    await tx.insert(apiKey).values(record);
  }

  /** Sets `revokedAt` only when it is still null, so repeat calls are no-ops. */
  async revoke(tx: Transaction, id: string): Promise<boolean> {
    const revoked = await tx
      .update(apiKey)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKey.id, id), isNull(apiKey.revokedAt)))
      .returning({ id: apiKey.id });

    return revoked.length > 0;
  }
}
