import { randomUUID } from "node:crypto";

import { and, asc, eq, gt, ilike, inArray, or, sql } from "drizzle-orm";

import type { FlagIndividualTarget, TargetingRuleInput } from "@dariise/contracts";

import { db } from "../../db/client.js";
import {
  environment,
  flag,
  flagDependency,
  flagEnvironmentConfig,
  flagIndividualTarget,
  flagVariation,
  flagVersion,
  project,
  targetingCondition,
  targetingRule,
} from "../../db/schema/index.js";
import type { Transaction } from "../../shared/types/db.js";
import type {
  DependencyRow,
  EnvironmentConfigDetail,
  EnvironmentConfigSummary,
  EnvironmentRef,
  FlagConfigRow,
  FlagListFilter,
  FlagRow,
  FlagStatusRef,
  FlagVersionRecord,
  FlagVersionSummary,
  IndividualTargetRow,
  NewFlagRecord,
  RuleWithConditions,
  UpdateConfigRecord,
  UpdateFlagRecord,
  VariationRow,
} from "./flags.types.js";
import { WORKSPACE_FLAG_CURSOR_SEPARATOR } from "./flags.types.js";

const DEFAULT_ROLLOUT_BUCKET = "userId";

export class FlagsRepository {
  /** Fetches limit + 1 rows so the caller can tell whether another page exists. */
  async list(projectId: string, filter: FlagListFilter): Promise<FlagRow[]> {
    const conditions = [eq(flag.projectId, projectId)];

    if (filter.status) {
      conditions.push(eq(flag.status, filter.status));
    }

    if (filter.search) {
      const pattern = `%${filter.search}%`;
      const match = or(ilike(flag.key, pattern), ilike(flag.name, pattern));

      if (match) conditions.push(match);
    }

    if (filter.cursor) {
      conditions.push(gt(flag.key, filter.cursor));
    }

    return db
      .select()
      .from(flag)
      .where(and(...conditions))
      .orderBy(asc(flag.key))
      .limit(filter.limit + 1);
  }

  async listConfigSummaries(
    flagIds: string[],
  ): Promise<EnvironmentConfigSummary[]> {
    if (flagIds.length === 0) return [];

    return db
      .select({
        flagId: flagEnvironmentConfig.flagId,
        environmentId: flagEnvironmentConfig.environmentId,
        environmentKey: environment.key,
        environmentName: environment.name,
        enabled: flagEnvironmentConfig.enabled,
        rolloutPercentage: flagEnvironmentConfig.rolloutPercentage,
      })
      .from(flagEnvironmentConfig)
      .innerJoin(
        environment,
        eq(environment.id, flagEnvironmentConfig.environmentId),
      )
      .where(inArray(flagEnvironmentConfig.flagId, flagIds))
      .orderBy(asc(environment.key));
  }

  async findByKey(projectId: string, key: string): Promise<FlagRow | null> {
    const rows = await db
      .select()
      .from(flag)
      .where(and(eq(flag.projectId, projectId), eq(flag.key, key)))
      .limit(1);

    return rows[0] ?? null;
  }

  async listEnvironments(projectId: string): Promise<EnvironmentRef[]> {
    return db
      .select({
        id: environment.id,
        key: environment.key,
        name: environment.name,
      })
      .from(environment)
      .where(eq(environment.projectId, projectId))
      .orderBy(asc(environment.key));
  }

  async findEnvironmentByKey(
    projectId: string,
    key: string,
  ): Promise<EnvironmentRef | null> {
    const rows = await db
      .select({
        id: environment.id,
        key: environment.key,
        name: environment.name,
      })
      .from(environment)
      .where(and(eq(environment.projectId, projectId), eq(environment.key, key)))
      .limit(1);

    return rows[0] ?? null;
  }

  async insert(tx: Transaction, record: NewFlagRecord): Promise<void> {
    await tx.insert(flag).values(record);
  }

  async update(
    tx: Transaction,
    id: string,
    patch: UpdateFlagRecord,
  ): Promise<void> {
    await tx
      .update(flag)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(flag.id, id));
  }

  async archive(tx: Transaction, id: string): Promise<void> {
    await tx
      .update(flag)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(flag.id, id));
  }

  /** Every environment starts with the flag off and the standard on/off pair. */
  async insertEnvironmentConfig(
    tx: Transaction,
    input: { flagId: string; environmentId: string },
  ): Promise<void> {
    await tx.insert(flagEnvironmentConfig).values({
      id: randomUUID(),
      flagId: input.flagId,
      environmentId: input.environmentId,
      enabled: false,
      offVariationKey: "off",
      defaultVariationKey: "on",
      rolloutPercentage: 0,
      bucketBy: DEFAULT_ROLLOUT_BUCKET,
    });

    await tx.insert(flagVariation).values([
      {
        id: randomUUID(),
        flagId: input.flagId,
        environmentId: input.environmentId,
        key: "on",
        name: "On",
        value: true,
        priority: 0,
      },
      {
        id: randomUUID(),
        flagId: input.flagId,
        environmentId: input.environmentId,
        key: "off",
        name: "Off",
        value: false,
        priority: 1,
      },
    ]);
  }

  async findConfig(
    flagId: string,
    environmentId: string,
  ): Promise<FlagConfigRow | null> {
    const rows = await db
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
      .where(
        and(
          eq(flagEnvironmentConfig.flagId, flagId),
          eq(flagEnvironmentConfig.environmentId, environmentId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async listConfigsForFlag(flagId: string): Promise<
    Array<{ config: FlagConfigRow; environment: EnvironmentRef }>
  > {
    const rows = await db
      .select({
        flagId: flagEnvironmentConfig.flagId,
        environmentId: flagEnvironmentConfig.environmentId,
        enabled: flagEnvironmentConfig.enabled,
        offVariationKey: flagEnvironmentConfig.offVariationKey,
        defaultVariationKey: flagEnvironmentConfig.defaultVariationKey,
        rolloutPercentage: flagEnvironmentConfig.rolloutPercentage,
        bucketBy: flagEnvironmentConfig.bucketBy,
        environmentKey: environment.key,
        environmentName: environment.name,
      })
      .from(flagEnvironmentConfig)
      .innerJoin(
        environment,
        eq(environment.id, flagEnvironmentConfig.environmentId),
      )
      .where(eq(flagEnvironmentConfig.flagId, flagId))
      .orderBy(asc(environment.key));

    return rows.map((row) => ({
      config: {
        flagId: row.flagId,
        environmentId: row.environmentId,
        enabled: row.enabled,
        offVariationKey: row.offVariationKey,
        defaultVariationKey: row.defaultVariationKey,
        rolloutPercentage: row.rolloutPercentage,
        bucketBy: row.bucketBy,
      },
      environment: {
        id: row.environmentId,
        key: row.environmentKey,
        name: row.environmentName,
      },
    }));
  }

  async listVariations(
    flagId: string,
    environmentId: string,
  ): Promise<VariationRow[]> {
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
      .where(
        and(
          eq(flagVariation.flagId, flagId),
          eq(flagVariation.environmentId, environmentId),
        ),
      )
      .orderBy(asc(flagVariation.priority));
  }

  async listVariationsForFlag(flagId: string): Promise<VariationRow[]> {
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
      .where(eq(flagVariation.flagId, flagId))
      .orderBy(asc(flagVariation.priority));
  }

  async updateConfig(
    tx: Transaction,
    flagId: string,
    environmentId: string,
    record: UpdateConfigRecord,
  ): Promise<void> {
    await tx
      .update(flagEnvironmentConfig)
      .set({
        enabled: record.enabled,
        offVariationKey: record.offVariation,
        defaultVariationKey: record.defaultVariation,
        rolloutPercentage: record.rolloutPercentage,
        bucketBy: record.bucketBy,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(flagEnvironmentConfig.flagId, flagId),
          eq(flagEnvironmentConfig.environmentId, environmentId),
        ),
      );
  }

  async replaceVariations(
    tx: Transaction,
    flagId: string,
    environmentId: string,
    variations: UpdateConfigRecord["variations"],
  ): Promise<void> {
    await tx
      .delete(flagVariation)
      .where(
        and(
          eq(flagVariation.flagId, flagId),
          eq(flagVariation.environmentId, environmentId),
        ),
      );

    await tx.insert(flagVariation).values(
      variations.map((variation, index) => ({
        id: randomUUID(),
        flagId,
        environmentId,
        key: variation.key,
        name: variation.name,
        value: variation.value,
        description: variation.description,
        priority: index,
      })),
    );
  }

  /** One past the highest version the flag already has. */
  async nextVersion(
    tx: Transaction,
    flagId: string,
  ): Promise<number> {
    const [row] = await tx
      .select({
        next: sql<number>`coalesce(max(${flagVersion.version}), 0) + 1`,
      })
      .from(flagVersion)
      .where(eq(flagVersion.flagId, flagId));

    return Number(row?.next ?? 1);
  }

  async insertVersion(
    tx: Transaction,
    record: FlagVersionRecord,
  ): Promise<void> {
    await tx.insert(flagVersion).values({
      id: randomUUID(),
      ...record,
    });
  }

  async listVersions(
    flagId: string,
    limit: number,
    cursor: string | null,
  ): Promise<FlagVersionSummary[]> {
    const conditions = [eq(flagVersion.flagId, flagId)];

    if (cursor) {
      conditions.push(sql`${flagVersion.version} < ${Number(cursor)}`);
    }

    return db
      .select({
        version: flagVersion.version,
        description: flagVersion.description,
        author: flagVersion.author,
        snapshot: flagVersion.snapshot,
        createdAt: flagVersion.createdAt,
      })
      .from(flagVersion)
      .where(and(...conditions))
      .orderBy(sql`${flagVersion.version} desc`)
      .limit(limit + 1);
  }

  async listRules(flagId: string): Promise<RuleWithConditions[]> {
    const rules = await db
      .select({
        id: targetingRule.id,
        flagId: targetingRule.flagId,
        environmentId: targetingRule.environmentId,
        priority: targetingRule.priority,
        description: targetingRule.description,
        variationKey: targetingRule.variationKey,
        segmentKeys: targetingRule.segmentKeys,
        rolloutPercentage: targetingRule.rolloutPercentage,
        bucketBy: targetingRule.bucketBy,
      })
      .from(targetingRule)
      .where(eq(targetingRule.flagId, flagId))
      .orderBy(asc(targetingRule.priority));

    if (rules.length === 0) return [];

    const conditions = await db
      .select({
        id: targetingCondition.id,
        ruleId: targetingCondition.ruleId,
        attribute: targetingCondition.attribute,
        attributeType: targetingCondition.attributeType,
        operator: targetingCondition.operator,
        values: targetingCondition.values,
        priority: targetingCondition.priority,
      })
      .from(targetingCondition)
      .where(
        inArray(
          targetingCondition.ruleId,
          rules.map((rule) => rule.id),
        ),
      )
      .orderBy(asc(targetingCondition.priority));

    return rules.map((rule) => ({
      rule,
      conditions: conditions.filter(
        (condition) => condition.ruleId === rule.id,
      ),
    }));
  }

  /** Replaces the whole ordered rule set: order is the array's order. */
  async replaceRules(
    tx: Transaction,
    flagId: string,
    environmentId: string,
    rules: TargetingRuleInput[],
  ): Promise<void> {
    await tx
      .delete(targetingRule)
      .where(
        and(
          eq(targetingRule.flagId, flagId),
          eq(targetingRule.environmentId, environmentId),
        ),
      );

    for (const [index, rule] of rules.entries()) {
      const ruleId = randomUUID();

      await tx.insert(targetingRule).values({
        id: ruleId,
        flagId,
        environmentId,
        priority: index,
        description: rule.description ?? null,
        variationKey: rule.variation,
        segmentKeys: rule.segmentKeys,
        rolloutPercentage: rule.rollout?.percentage ?? null,
        bucketBy: rule.rollout?.bucketBy ?? null,
      });

      if (rule.conditions.length === 0) continue;

      await tx.insert(targetingCondition).values(
        rule.conditions.map((condition, conditionIndex) => ({
          id: randomUUID(),
          ruleId,
          attribute: condition.attribute,
          attributeType: condition.attributeType,
          operator: condition.operator,
          values: condition.values,
          priority: conditionIndex,
        })),
      );
    }
  }

  async listTargets(flagId: string): Promise<IndividualTargetRow[]> {
    return db
      .select({
        flagId: flagIndividualTarget.flagId,
        environmentId: flagIndividualTarget.environmentId,
        userId: flagIndividualTarget.userId,
        variationKey: flagIndividualTarget.variationKey,
      })
      .from(flagIndividualTarget)
      .where(eq(flagIndividualTarget.flagId, flagId));
  }

  async replaceTargets(
    tx: Transaction,
    flagId: string,
    environmentId: string,
    targets: FlagIndividualTarget[],
  ): Promise<void> {
    await tx
      .delete(flagIndividualTarget)
      .where(
        and(
          eq(flagIndividualTarget.flagId, flagId),
          eq(flagIndividualTarget.environmentId, environmentId),
        ),
      );

    if (targets.length === 0) return;

    await tx.insert(flagIndividualTarget).values(
      targets.map((target) => ({
        id: randomUUID(),
        flagId,
        environmentId,
        userId: target.userId,
        variationKey: target.variationKey,
      })),
    );
  }

  async listDependencies(
    projectId: string,
    flagKey: string,
  ): Promise<DependencyRow[]> {
    return db
      .select({
        key: flagDependency.key,
        requires: flagDependency.requires,
        referencedIn: flagDependency.referencedIn,
      })
      .from(flagDependency)
      .where(
        and(
          eq(flagDependency.projectId, projectId),
          or(
            eq(flagDependency.key, flagKey),
            eq(flagDependency.requires, flagKey),
          ),
        ),
      );
  }

  async findStatuses(
    projectId: string,
    keys: string[],
  ): Promise<FlagStatusRef[]> {
    if (keys.length === 0) return [];

    return db
      .select({ key: flag.key, status: flag.status })
      .from(flag)
      .where(and(eq(flag.projectId, projectId), inArray(flag.key, keys)));
  }

  /** The workspace-wide list: every project in the session's workspace. */
  async listForWorkspace(
    organizationId: string,
    filter: FlagListFilter & { projectKey?: string },
  ): Promise<Array<FlagRow & { projectKey: string }>> {
    const conditions = [eq(project.organizationId, organizationId)];

    if (filter.projectKey) {
      conditions.push(eq(project.key, filter.projectKey));
    }

    if (filter.status) {
      conditions.push(eq(flag.status, filter.status));
    }

    if (filter.search) {
      const pattern = `%${filter.search}%`;
      const match = or(ilike(flag.key, pattern), ilike(flag.name, pattern));

      if (match) conditions.push(match);
    }

    if (filter.cursor) {
      const [cursorProject, cursorFlag] =
        filter.cursor.split(WORKSPACE_FLAG_CURSOR_SEPARATOR);

      if (cursorProject && cursorFlag) {
        conditions.push(
          sql`(${project.key}, ${flag.key}) > (${cursorProject}, ${cursorFlag})`,
        );
      }
    }

    return db
      .select({
        id: flag.id,
        projectId: flag.projectId,
        key: flag.key,
        name: flag.name,
        description: flag.description,
        type: flag.type,
        tags: flag.tags,
        owner: flag.owner,
        status: flag.status,
        createdAt: flag.createdAt,
        updatedAt: flag.updatedAt,
        projectKey: project.key,
      })
      .from(flag)
      .innerJoin(project, eq(project.id, flag.projectId))
      .where(and(...conditions))
      .orderBy(asc(project.key), asc(flag.key))
      .limit(filter.limit + 1);
  }

  async detailForFlag(flagId: string): Promise<EnvironmentConfigDetail[]> {
    const [configs, variations, rules, targets] = await Promise.all([
      this.listConfigsForFlag(flagId),
      this.listVariationsForFlag(flagId),
      this.listRules(flagId),
      this.listTargets(flagId),
    ]);

    return configs.map(({ config, environment: env }) => ({
      environment: env,
      config,
      variations: variations.filter(
        (variation) => variation.environmentId === env.id,
      ),
      rules: rules.filter((entry) => entry.rule.environmentId === env.id),
      targets: targets.filter((target) => target.environmentId === env.id),
    }));
  }
}
