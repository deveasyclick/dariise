import { randomUUID } from "node:crypto";

import {
  and,
  asc,
  eq,
  getTableColumns,
  gt,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";

import type {
  FlagIndividualTarget,
  TargetingRuleInput,
} from "@dariise/contracts";

import { db } from "../../db/client.js";
import {
  environment,
  flag,
  flagDependency,
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
  EnvironmentRef,
  FlagCopyInput,
  FlagListFilter,
  FlagListRow,
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

export class FlagsRepository {
  /** Fetches limit + 1 rows so the caller can tell whether another page exists. */
  async list(
    projectId: string,
    environmentId: string,
    filter: FlagListFilter,
  ): Promise<FlagListRow[]> {
    const conditions = [
      eq(flag.projectId, projectId),
      eq(flag.environmentId, environmentId),
    ];

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
      .select({ ...getTableColumns(flag), ...this.environmentColumns() })
      .from(flag)
      .innerJoin(environment, eq(environment.id, flag.environmentId))
      .where(and(...conditions))
      .orderBy(asc(flag.key))
      .limit(filter.limit + 1);
  }

  async findByKey(
    projectId: string,
    environmentId: string,
    key: string,
  ): Promise<FlagRow | null> {
    const rows = await db
      .select()
      .from(flag)
      .where(
        and(
          eq(flag.projectId, projectId),
          eq(flag.environmentId, environmentId),
          eq(flag.key, key),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  /** Read inside a transaction, so a copy sees the rows it is about to write. */
  async findById(tx: Transaction, id: string): Promise<FlagRow | null> {
    const rows = await tx
      .select()
      .from(flag)
      .where(eq(flag.id, id))
      .limit(1);

    return rows[0] ?? null;
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
        isProtected: environment.isProtected,
        archivedAt: environment.archivedAt,
      })
      .from(environment)
      .where(
        and(eq(environment.projectId, projectId), eq(environment.key, key)),
      )
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

  /**
   * Writes the flag's configuration. The flag row *is* the configuration, so
   * this has no environment of its own to name: the row already has one.
   */
  async updateConfig(
    tx: Transaction,
    flagId: string,
    record: UpdateConfigRecord,
  ): Promise<void> {
    await tx
      .update(flag)
      .set({
        enabled: record.enabled,
        offVariationKey: record.offVariation,
        defaultVariationKey: record.defaultVariation,
        rolloutPercentage: record.rolloutPercentage,
        bucketBy: record.bucketBy,
        updatedAt: new Date(),
      })
      .where(eq(flag.id, flagId));
  }

  /**
   * The `on`/`off` pair a flag starts with. The values have to fit the flag's
   * declared type — a `string` flag serving `true` would break the promise its
   * type makes to the SDK — so the caller passes either the chosen pair or
   * `defaultVariations(type)`.
   */
  async insertVariations(
    tx: Transaction,
    input: { flagId: string; values: { on: unknown; off: unknown } },
  ): Promise<void> {
    await tx.insert(flagVariation).values([
      {
        id: randomUUID(),
        flagId: input.flagId,
        key: "on",
        name: "On",
        value: input.values.on,
        priority: 0,
      },
      {
        id: randomUUID(),
        flagId: input.flagId,
        key: "off",
        name: "Off",
        value: input.values.off,
        priority: 1,
      },
    ]);
  }

  async listVariations(flagId: string): Promise<VariationRow[]> {
    return db
      .select({
        flagId: flagVariation.flagId,
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

  async replaceVariations(
    tx: Transaction,
    flagId: string,
    variations: UpdateConfigRecord["variations"],
  ): Promise<void> {
    await tx.delete(flagVariation).where(eq(flagVariation.flagId, flagId));

    await tx.insert(flagVariation).values(
      variations.map((variation, index) => ({
        id: randomUUID(),
        flagId,
        key: variation.key,
        name: variation.name,
        value: variation.value,
        description: variation.description,
        priority: index,
      })),
    );
  }

  /** One past the highest version the flag already has. */
  async nextVersion(tx: Transaction, flagId: string): Promise<number> {
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
    rules: TargetingRuleInput[],
  ): Promise<void> {
    await tx.delete(targetingRule).where(eq(targetingRule.flagId, flagId));

    for (const [index, rule] of rules.entries()) {
      const ruleId = randomUUID();

      await tx.insert(targetingRule).values({
        id: ruleId,
        flagId,
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
        userId: flagIndividualTarget.userId,
        variationKey: flagIndividualTarget.variationKey,
      })
      .from(flagIndividualTarget)
      .where(eq(flagIndividualTarget.flagId, flagId));
  }

  async replaceTargets(
    tx: Transaction,
    flagId: string,
    targets: FlagIndividualTarget[],
  ): Promise<void> {
    await tx
      .delete(flagIndividualTarget)
      .where(eq(flagIndividualTarget.flagId, flagId));

    if (targets.length === 0) return;

    await tx.insert(flagIndividualTarget).values(
      targets.map((target) => ({
        id: randomUUID(),
        flagId,
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
    filter: FlagListFilter & {
      projectKey?: string;
      environmentKey?: string;
    },
  ): Promise<Array<FlagListRow & { projectKey: string }>> {
    const conditions = [eq(project.organizationId, organizationId)];

    if (filter.projectKey) {
      conditions.push(eq(project.key, filter.projectKey));
    }

    if (filter.environmentKey) {
      conditions.push(eq(environment.key, filter.environmentKey));
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
      // Ordered by (project, environment, flag key), so the cursor holds all
      // three and the comparison is the same tuple comparison the SQL does.
      const [cursorProject, cursorEnvironment, cursorFlag] =
        filter.cursor.split(WORKSPACE_FLAG_CURSOR_SEPARATOR);

      if (cursorProject && cursorEnvironment && cursorFlag) {
        conditions.push(
          sql`(${project.key}, ${environment.key}, ${flag.key}) > (${cursorProject}, ${cursorEnvironment}, ${cursorFlag})`,
        );
      }
    }

    return db
      .select({
        ...getTableColumns(flag),
        ...this.environmentColumns(),
        projectKey: project.key,
      })
      .from(flag)
      .innerJoin(project, eq(project.id, flag.projectId))
      .innerJoin(environment, eq(environment.id, flag.environmentId))
      .where(and(...conditions))
      .orderBy(asc(project.key), asc(environment.key), asc(flag.key))
      .limit(filter.limit + 1);
  }

  /** The flags of one environment, in a stable order, for a whole-environment copy. */
  async listIdsInEnvironment(
    tx: Transaction,
    environmentId: string,
  ): Promise<string[]> {
    const rows = await tx
      .select({ id: flag.id })
      .from(flag)
      .where(eq(flag.environmentId, environmentId))
      .orderBy(asc(flag.key));

    return rows.map((row) => row.id);
  }

  /**
   * The one copy primitive: identity, configuration, variations, targeting
   * rules and individual targets all move together, so a promoted flag behaves
   * exactly like the one it came from until somebody changes it.
   *
   * It writes inside the caller's transaction and does not check whether the
   * key is free — that decision belongs to the service, which knows which
   * caller is copying and why.
   */
  async copyFlagIntoEnvironment(
    tx: Transaction,
    input: FlagCopyInput,
  ): Promise<string> {
    const [source] = await tx
      .select()
      .from(flag)
      .where(eq(flag.id, input.sourceFlagId))
      .limit(1);

    if (!source) {
      throw new Error("The flag to copy no longer exists.");
    }

    const targetId = randomUUID();

    await tx.insert(flag).values({
      id: targetId,
      projectId: source.projectId,
      environmentId: input.targetEnvironmentId,
      key: source.key,
      name: source.name,
      description: source.description,
      type: source.type,
      tags: source.tags,
      owner: source.owner,
      status: source.status,
      enabled: source.enabled,
      offVariationKey: source.offVariationKey,
      defaultVariationKey: source.defaultVariationKey,
      rolloutPercentage: source.rolloutPercentage,
      bucketBy: source.bucketBy,
    });

    const variations = await tx
      .select()
      .from(flagVariation)
      .where(eq(flagVariation.flagId, source.id))
      .orderBy(asc(flagVariation.priority));

    if (variations.length > 0) {
      await tx.insert(flagVariation).values(
        variations.map((variation) => ({
          id: randomUUID(),
          flagId: targetId,
          key: variation.key,
          name: variation.name,
          value: variation.value,
          description: variation.description,
          priority: variation.priority,
        })),
      );
    }

    const rules = await tx
      .select()
      .from(targetingRule)
      .where(eq(targetingRule.flagId, source.id))
      .orderBy(asc(targetingRule.priority));

    for (const rule of rules) {
      const ruleId = randomUUID();

      await tx.insert(targetingRule).values({
        id: ruleId,
        flagId: targetId,
        priority: rule.priority,
        description: rule.description,
        variationKey: rule.variationKey,
        segmentKeys: rule.segmentKeys,
        rolloutPercentage: rule.rolloutPercentage,
        bucketBy: rule.bucketBy,
      });

      const conditions = await tx
        .select()
        .from(targetingCondition)
        .where(eq(targetingCondition.ruleId, rule.id))
        .orderBy(asc(targetingCondition.priority));

      if (conditions.length === 0) continue;

      await tx.insert(targetingCondition).values(
        conditions.map((condition) => ({
          id: randomUUID(),
          ruleId,
          attribute: condition.attribute,
          attributeType: condition.attributeType,
          operator: condition.operator,
          values: condition.values,
          priority: condition.priority,
        })),
      );
    }

    const targets = await tx
      .select()
      .from(flagIndividualTarget)
      .where(eq(flagIndividualTarget.flagId, source.id));

    if (targets.length > 0) {
      await tx.insert(flagIndividualTarget).values(
        targets.map((target) => ({
          id: randomUUID(),
          flagId: targetId,
          userId: target.userId,
          variationKey: target.variationKey,
        })),
      );
    }

    return targetId;
  }

  /** Every rule and target of one flag, for the detail screen. */
  async detailParts(
    flagId: string,
  ): Promise<{ rules: RuleWithConditions[]; targets: IndividualTargetRow[] }> {
    const [rules, targets] = await Promise.all([
      this.listRules(flagId),
      this.listTargets(flagId),
    ]);

    return { rules, targets };
  }

  private environmentColumns() {
    return {
      environmentKey: environment.key,
      environmentName: environment.name,
    };
  }
}
