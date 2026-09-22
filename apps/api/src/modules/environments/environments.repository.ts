import { randomUUID } from "node:crypto";

import { and, asc, count, eq, gt, inArray, isNull, or } from "drizzle-orm";

import { db } from "../../db/client.js";
import {
  apiKey,
  environment,
  flag,
  flagEnvironmentConfig,
  flagVariation,
} from "../../db/schema/index.js";
import type { Transaction } from "../../shared/types/db.js";
import type {
  CoverageConfigRow,
  EnvironmentRow,
  FlagConfigRecord,
  FlagRef,
  NewEnvironmentRecord,
  VariationRecord,
} from "./environments.types.js";

export class EnvironmentsRepository {
  /** Fetches limit + 1 rows so the caller can tell whether another page exists. */
  async list(
    projectId: string,
    limit: number,
    cursor: string | null,
  ): Promise<EnvironmentRow[]> {
    const conditions = [eq(environment.projectId, projectId)];

    if (cursor) {
      conditions.push(gt(environment.key, cursor));
    }

    return db
      .select()
      .from(environment)
      .where(and(...conditions))
      .orderBy(asc(environment.key))
      .limit(limit + 1);
  }

  async listAll(projectId: string): Promise<EnvironmentRow[]> {
    return db
      .select()
      .from(environment)
      .where(eq(environment.projectId, projectId))
      .orderBy(asc(environment.key));
  }

  async findByKey(
    projectId: string,
    key: string,
  ): Promise<EnvironmentRow | null> {
    const rows = await db
      .select()
      .from(environment)
      .where(
        and(eq(environment.projectId, projectId), eq(environment.key, key)),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async countForProject(projectId: string): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(environment)
      .where(eq(environment.projectId, projectId));

    return row?.value ?? 0;
  }

  async insert(
    tx: Transaction,
    record: NewEnvironmentRecord,
  ): Promise<void> {
    await tx.insert(environment).values(record);
  }

  async updateSettings(
    tx: Transaction,
    id: string,
    settings: NewEnvironmentRecord["settings"],
  ): Promise<void> {
    await tx
      .update(environment)
      .set({
        settings,
        isProtected: settings.protectedEnvironment,
        updatedAt: new Date(),
      })
      .where(eq(environment.id, id));
  }

  async listFlags(projectId: string): Promise<FlagRef[]> {
    return db
      .select({ id: flag.id, key: flag.key })
      .from(flag)
      .where(eq(flag.projectId, projectId))
      .orderBy(asc(flag.key));
  }

  async listFlagPage(
    projectId: string,
    limit: number,
    cursor: string | null,
  ): Promise<FlagRef[]> {
    const conditions = [eq(flag.projectId, projectId)];

    if (cursor) {
      conditions.push(gt(flag.key, cursor));
    }

    return db
      .select({ id: flag.id, key: flag.key })
      .from(flag)
      .where(and(...conditions))
      .orderBy(asc(flag.key))
      .limit(limit + 1);
  }

  async listConfigs(environmentId: string): Promise<FlagConfigRecord[]> {
    return db
      .select({
        flagId: flagEnvironmentConfig.flagId,
        environmentId: flagEnvironmentConfig.environmentId,
        enabled: flagEnvironmentConfig.enabled,
        offVariationKey: flagEnvironmentConfig.offVariationKey,
        defaultVariationKey: flagEnvironmentConfig.defaultVariationKey,
        rolloutPercentage: flagEnvironmentConfig.rolloutPercentage,
        bucketBy: flagEnvironmentConfig.bucketBy,
      })
      .from(flagEnvironmentConfig)
      .where(eq(flagEnvironmentConfig.environmentId, environmentId));
  }

  async listVariations(environmentId: string): Promise<VariationRecord[]> {
    return db
      .select({
        flagId: flagVariation.flagId,
        environmentId: flagVariation.environmentId,
        key: flagVariation.key,
        name: flagVariation.name,
        value: flagVariation.value,
        description: flagVariation.description,
        priority: flagVariation.priority,
      })
      .from(flagVariation)
      .where(eq(flagVariation.environmentId, environmentId))
      .orderBy(asc(flagVariation.priority));
  }

  async insertConfig(
    tx: Transaction,
    record: FlagConfigRecord,
  ): Promise<void> {
    await tx.insert(flagEnvironmentConfig).values({
      id: randomUUID(),
      ...record,
    });
  }

  async insertVariations(
    tx: Transaction,
    records: VariationRecord[],
  ): Promise<void> {
    if (records.length === 0) return;

    await tx.insert(flagVariation).values(
      records.map((record) => ({ id: randomUUID(), ...record })),
    );
  }

  async listCoverageConfigs(
    projectId: string,
    flagIds: string[],
  ): Promise<CoverageConfigRow[]> {
    if (flagIds.length === 0) return [];

    return db
      .select({
        flagId: flagEnvironmentConfig.flagId,
        environmentKey: environment.key,
        enabled: flagEnvironmentConfig.enabled,
        rolloutPercentage: flagEnvironmentConfig.rolloutPercentage,
      })
      .from(flagEnvironmentConfig)
      .innerJoin(
        environment,
        eq(environment.id, flagEnvironmentConfig.environmentId),
      )
      .where(
        and(
          eq(environment.projectId, projectId),
          inArray(flagEnvironmentConfig.flagId, flagIds),
        ),
      );
  }

  /**
   * The most recent usable key for the connection preview: environment-specific
   * keys first, then workspace-wide ones. Only the prefix is ever read.
   */
  async findUsableKeyPrefix(
    projectId: string,
    environmentId: string,
  ): Promise<string | null> {
    const rows = await db
      .select({ prefix: apiKey.prefix })
      .from(apiKey)
      .where(
        and(
          eq(apiKey.projectId, projectId),
          or(
            eq(apiKey.environmentId, environmentId),
            isNull(apiKey.environmentId),
          ),
          isNull(apiKey.revokedAt),
        ),
      )
      .orderBy(asc(apiKey.createdAt))
      .limit(1);

    return rows[0]?.prefix ?? null;
  }
}
