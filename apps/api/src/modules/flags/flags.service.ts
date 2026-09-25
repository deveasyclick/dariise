import { randomUUID } from "node:crypto";

import {
  defaultVariations,
  variationValueMatchesType,
  type AuditAction,
  type CreateFlagInput,
  type FlagChangePayload,
  type FlagDependencyGraph,
  type FlagDetail,
  type FlagIndividualTarget,
  type FlagListQuery,
  type FlagSummary,
  type FlagType,
  type FlagVersion,
  type PromoteFlagInput,
  type ReplaceIndividualTargetsInput,
  type ReplaceTargetingRulesInput,
  type TargetingRule,
  type TargetingRuleInput,
  type UpdateFlagConfigInput,
  type UpdateFlagInput,
  type WorkspaceFlagListQuery,
  type WorkspaceFlagSummary,
} from "@dariise/contracts";

import { writeAuditLog } from "../../db/audit.js";
import { db } from "../../db/client.js";
import { ApiError } from "../../shared/http/errors.js";
import { decodeCursor, toPage } from "../../shared/pagination.js";
import type { Transaction } from "../../shared/types/db.js";
import type { Page } from "../../shared/types/pagination.js";
import type { ProjectAccessService } from "../project-access/index.js";
import { buildDependencyGraph } from "./flags.dependencies.js";
import {
  toFlagDetail,
  toFlagSummary,
  toFlagVersion,
  toIndividualTargets,
  toTargetingRules,
  toWorkspaceFlagSummary,
} from "./flags.mapper.js";
import type { FlagsRepository } from "./flags.repository.js";
import {
  WORKSPACE_FLAG_CURSOR_SEPARATOR,
  type EnvironmentRef,
  type EnvironmentScope,
  type FlagRow,
  type FlagsActorContext,
} from "./flags.types.js";

/**
 * Reads are viewer-level; every write needs the project role the ADR-0004
 * matrix grants, and each mutation writes its audit row inside its own
 * transaction.
 */
export class FlagsService {
  constructor(
    private readonly repository: FlagsRepository,
    private readonly projectAccess: ProjectAccessService,
    /** Injected by `app.ts` so flags never imports the segments module. */
    private readonly findUnknownSegments: (
      projectId: string,
      keys: string[],
    ) => Promise<string[]>,
  ) {}

  async list(
    context: FlagsActorContext,
    projectKey: string,
    query: FlagListQuery,
  ): Promise<Page<FlagSummary>> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole: "viewer",
    });

    const environment = await this.requireEnvironment(
      project.id,
      query.environmentKey,
    );

    const rows = await this.repository.list(project.id, environment.id, {
      search: query.search,
      status: query.status,
      limit: query.limit,
      // The cursor is opaque base64url; the repository compares real keys.
      cursor: decodeCursor(query.cursor),
    });

    const page = toPage(rows, query.limit, (row) => row.key);

    return {
      data: page.data.map(toFlagSummary),
      nextCursor: page.nextCursor,
    };
  }

  async create(
    context: FlagsActorContext,
    projectKey: string,
    input: CreateFlagInput,
  ): Promise<FlagDetail> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole: "engineer",
    });

    const environment = await this.requireEnvironment(
      project.id,
      input.environmentKey,
    );

    if (
      await this.repository.findByKey(project.id, environment.id, input.key)
    ) {
      throw ApiError.conflict(
        `A flag with that key already exists in ${environment.name}.`,
      );
    }

    const flagId = randomUUID();

    await db.transaction(async (tx) => {
      await this.repository.insert(tx, {
        id: flagId,
        projectId: project.id,
        environmentId: environment.id,
        key: input.key,
        name: input.name,
        description: input.description ?? null,
        type: input.type,
        tags: input.tags,
        owner: input.owner ?? null,
      });

      // The flag exists in this one environment, and it starts off serving the
      // values its type promises.
      await this.repository.insertVariations(tx, {
        flagId,
        values: input.values ?? defaultVariations(input.type),
      });

      await writeAuditLog(tx, {
        organizationId: context.organizationId,
        projectId: project.id,
        environmentId: environment.id,
        actor: context.userId,
        actorName: context.userName,
        action: "flag.created",
        target: flagId,
        changes: {
          key: input.key,
          name: input.name,
          type: input.type,
          environment: environment.key,
        },
      });

      await this.repository.insertVersion(tx, {
        flagId,
        projectId: project.id,
        version: await this.repository.nextVersion(tx, flagId),
        description: "Flag created",
        author: context.userId,
        snapshot: {
          environment: environment.key,
          key: input.key,
          type: input.type,
          tags: input.tags,
        },
      });
    });

    return this.loadDetail(
      await this.requireFlag(project.id, environment.id, input.key),
      environment,
    );
  }

  async get(
    context: FlagsActorContext,
    projectKey: string,
    environmentKey: string,
    flagKey: string,
  ): Promise<FlagDetail> {
    const scope = await this.environmentScope(
      context,
      projectKey,
      environmentKey,
      flagKey,
      "viewer",
    );

    return this.loadDetail(scope.flag, scope.environment);
  }

  async update(
    context: FlagsActorContext,
    projectKey: string,
    environmentKey: string,
    flagKey: string,
    input: UpdateFlagInput,
  ): Promise<FlagDetail> {
    const scope = await this.environmentScope(
      context,
      projectKey,
      environmentKey,
      flagKey,
      "engineer",
    );

    await db.transaction(async (tx) => {
      await this.repository.update(tx, scope.flag.id, input);

      await writeAuditLog(tx, {
        organizationId: context.organizationId,
        projectId: scope.project.id,
        environmentId: scope.environment.id,
        actor: context.userId,
        actorName: context.userName,
        action: "flag.updated",
        target: scope.flag.id,
        changes: input,
      });
    });

    return this.loadDetail(
      await this.requireFlag(
        scope.project.id,
        scope.environment.id,
        flagKey,
      ),
      scope.environment,
    );
  }

  async archive(
    context: FlagsActorContext,
    projectKey: string,
    environmentKey: string,
    flagKey: string,
  ): Promise<{ key: string; status: string }> {
    const scope = await this.environmentScope(
      context,
      projectKey,
      environmentKey,
      flagKey,
      // The ADR-0004 matrix lets an engineer archive a flag.
      "engineer",
    );

    await db.transaction(async (tx) => {
      await this.repository.archive(tx, scope.flag.id);

      await writeAuditLog(tx, {
        organizationId: context.organizationId,
        projectId: scope.project.id,
        environmentId: scope.environment.id,
        actor: context.userId,
        actorName: context.userName,
        action: "flag.archived",
        target: scope.flag.id,
        changes: { status: "archived", environment: scope.environment.key },
      });
    });

    return { key: scope.flag.key, status: "archived" };
  }

  async updateEnvironmentConfig(
    context: FlagsActorContext,
    projectKey: string,
    environmentKey: string,
    flagKey: string,
    input: UpdateFlagConfigInput,
  ): Promise<FlagDetail> {
    const scope = await this.environmentScope(
      context,
      projectKey,
      environmentKey,
      flagKey,
      "engineer",
    );

    this.assertPublishable(scope.environment);
    await this.validateConfigInput(scope.flag, input);

    const action =
      scope.flag.enabled !== input.enabled
        ? input.enabled
          ? "flag.enabled"
          : "flag.disabled"
        : scope.flag.rolloutPercentage !== input.rolloutPercentage
          ? "rollout.updated"
          : "flag.updated";

    await db.transaction(async (tx) => {
      await this.publishConfig(tx, context, scope, input, action);
    });

    return this.loadDetail(
      await this.requireFlag(
        scope.project.id,
        scope.environment.id,
        flagKey,
      ),
      scope.environment,
    );
  }

  /**
   * Copies one flag, whole, into another environment of the same project.
   *
   * The two flags are independent from here on: this is how a change reaches
   * production, not a link between the environments.
   */
  async promote(
    context: FlagsActorContext,
    projectKey: string,
    environmentKey: string,
    flagKey: string,
    input: PromoteFlagInput,
  ): Promise<FlagDetail> {
    const scope = await this.environmentScope(
      context,
      projectKey,
      environmentKey,
      flagKey,
      "engineer",
    );

    const target = await this.requireEnvironment(scope.project.id, input.to);

    if (target.id === scope.environment.id) {
      throw ApiError.badRequest(
        "That flag is already in this environment; choose a different one.",
      );
    }

    if (target.archivedAt) {
      throw ApiError.conflict(
        "That environment is archived. Unarchive it before promoting into it.",
      );
    }

    // Promotion writes a whole new flag into the target, so a protected
    // environment refuses it exactly as a direct publish would.
    this.assertPublishable(target);

    if (await this.repository.findByKey(scope.project.id, target.id, flagKey)) {
      throw ApiError.conflict(
        `"${flagKey}" already exists in ${target.name}. Rename one of them first.`,
      );
    }

    await db.transaction(async (tx) => {
      const newFlagId = await this.copyFlag(tx, {
        source: scope.flag,
        target,
        projectId: scope.project.id,
        author: context.userId,
        reason: `Promoted from ${scope.environment.name}`,
      });

      await writeAuditLog(tx, {
        organizationId: context.organizationId,
        projectId: scope.project.id,
        environmentId: target.id,
        actor: context.userId,
        actorName: context.userName,
        action: "flag.promoted",
        target: newFlagId,
        changes: {
          key: flagKey,
          from: scope.environment.key,
          to: target.key,
        },
      });
    });

    return this.loadDetail(
      await this.requireFlag(scope.project.id, target.id, flagKey),
      target,
    );
  }

  /**
   * The `copy-source` half of creating an environment: every flag of the
   * source environment is copied into the new one. Runs in the caller's
   * transaction so an environment is never half-populated.
   *
   * The flags have no audit rows of their own; `environment.created` records
   * the copy once, which is what a reader is looking for.
   */
  async copyEnvironmentFlags(
    tx: Transaction,
    input: {
      projectId: string;
      source: EnvironmentRef;
      target: EnvironmentRef;
      author: string;
    },
  ): Promise<number> {
    const sourceFlagIds = await this.repository.listIdsInEnvironment(
      tx,
      input.source.id,
    );

    for (const sourceFlagId of sourceFlagIds) {
      const source = await this.repository.findById(tx, sourceFlagId);

      if (!source) continue;

      await this.copyFlag(tx, {
        source,
        target: input.target,
        projectId: input.projectId,
        author: input.author,
        reason: `Copied from ${input.source.name}`,
      });
    }

    return sourceFlagIds.length;
  }

  /**
   * The workspace-wide screen. Scoped by the session's workspace rather than a
   * project gate, because it deliberately spans every project in it.
   */
  async listWorkspace(
    context: FlagsActorContext,
    query: WorkspaceFlagListQuery,
  ): Promise<Page<WorkspaceFlagSummary>> {
    const rows = await this.repository.listForWorkspace(
      context.organizationId,
      {
        search: query.search,
        status: query.status,
        projectKey: query.projectKey,
        environmentKey: query.environmentKey,
        limit: query.limit,
        cursor: decodeCursor(query.cursor),
      },
    );

    const page = toPage(
      rows,
      query.limit,
      (row) =>
        `${row.projectKey}${WORKSPACE_FLAG_CURSOR_SEPARATOR}${row.environmentKey}${WORKSPACE_FLAG_CURSOR_SEPARATOR}${row.key}`,
    );

    return {
      data: page.data.map((row) =>
        toWorkspaceFlagSummary(row, row.projectKey),
      ),
      nextCursor: page.nextCursor,
    };
  }

  /** `GET /v1/flags/:flagKey` requires a project key: keys collide across projects. */
  async resolve(
    context: FlagsActorContext,
    flagKey: string,
    projectKey: string,
    environmentKey: string,
  ): Promise<FlagDetail> {
    return this.get(context, projectKey, environmentKey, flagKey);
  }

  async getRules(
    context: FlagsActorContext,
    projectKey: string,
    environmentKey: string,
    flagKey: string,
  ): Promise<TargetingRule[]> {
    const scope = await this.environmentScope(
      context,
      projectKey,
      environmentKey,
      flagKey,
      "viewer",
    );

    return toTargetingRules(await this.repository.listRules(scope.flag.id));
  }

  async replaceRules(
    context: FlagsActorContext,
    projectKey: string,
    environmentKey: string,
    flagKey: string,
    input: ReplaceTargetingRulesInput,
  ): Promise<TargetingRule[]> {
    const scope = await this.environmentScope(
      context,
      projectKey,
      environmentKey,
      flagKey,
      "engineer",
    );

    this.assertPublishable(scope.environment);
    await this.validateRules(scope, input);

    await db.transaction(async (tx) => {
      await this.publishRules(tx, context, scope, input.rules);
    });

    return toTargetingRules(await this.repository.listRules(scope.flag.id));
  }

  async getTargets(
    context: FlagsActorContext,
    projectKey: string,
    environmentKey: string,
    flagKey: string,
  ): Promise<FlagIndividualTarget[]> {
    const scope = await this.environmentScope(
      context,
      projectKey,
      environmentKey,
      flagKey,
      "viewer",
    );

    return toIndividualTargets(
      await this.repository.listTargets(scope.flag.id),
    );
  }

  async replaceTargets(
    context: FlagsActorContext,
    projectKey: string,
    environmentKey: string,
    flagKey: string,
    input: ReplaceIndividualTargetsInput,
  ): Promise<FlagIndividualTarget[]> {
    const scope = await this.environmentScope(
      context,
      projectKey,
      environmentKey,
      flagKey,
      "engineer",
    );

    this.assertPublishable(scope.environment);
    await this.validateTargets(scope, input);

    await db.transaction(async (tx) => {
      await this.publishTargets(tx, context, scope, input.targets);
    });

    return toIndividualTargets(
      await this.repository.listTargets(scope.flag.id),
    );
  }

  async getDependencies(
    context: FlagsActorContext,
    projectKey: string,
    environmentKey: string,
    flagKey: string,
  ): Promise<FlagDependencyGraph> {
    const scope = await this.environmentScope(
      context,
      projectKey,
      environmentKey,
      flagKey,
      "viewer",
    );

    const rows = await this.repository.listDependencies(
      scope.project.id,
      flagKey,
    );
    const keys = new Set<string>([flagKey]);

    for (const row of rows) {
      keys.add(row.key);
      keys.add(row.requires);
    }

    const statuses = await this.repository.findStatuses(scope.project.id, [
      ...keys,
    ]);

    return buildDependencyGraph(flagKey, rows, statuses);
  }

  async listVersions(
    context: FlagsActorContext,
    projectKey: string,
    environmentKey: string,
    flagKey: string,
    limit: number,
    cursor: string | undefined,
  ): Promise<Page<FlagVersion>> {
    const scope = await this.environmentScope(
      context,
      projectKey,
      environmentKey,
      flagKey,
      "viewer",
    );

    const rows = await this.repository.listVersions(
      scope.flag.id,
      limit,
      decodeCursor(cursor),
    );

    const page = toPage(rows, limit, (version) => String(version.version));

    return {
      data: page.data.map((version) => toFlagVersion(version)),
      nextCursor: page.nextCursor,
    };
  }

  /**
   * Checks a proposed change without writing it, so an invalid proposal is
   * refused when it is made rather than when somebody is asked to approve it.
   */
  async validateProposedChange(
    context: FlagsActorContext,
    projectKey: string,
    flagKey: string,
    environmentKey: string,
    payload: FlagChangePayload,
  ): Promise<void> {
    await this.resolveApprovedChange(
      context,
      projectKey,
      flagKey,
      environmentKey,
      payload,
    );
  }

  /**
   * Applies an approved change request to a protected environment.
   *
   * The change-requests module owns the approval lifecycle and reaches this
   * through the applier `app.ts` injects; the HTTP layer cannot call it, which
   * is why it is not gated the way the direct writes are. It takes the caller's
   * transaction so the decision and the change commit together: an approver
   * approves a whole change, and half of it must never be visible.
   */
  async publishApprovedChange(
    tx: Transaction,
    context: FlagsActorContext,
    projectKey: string,
    flagKey: string,
    environmentKey: string,
    payload: FlagChangePayload,
  ): Promise<void> {
    const scope = await this.resolveApprovedChange(
      context,
      projectKey,
      flagKey,
      environmentKey,
      payload,
    );

    const { config } = payload;
    const action: AuditAction = config
      ? config.enabled !== scope.flag.enabled
        ? config.enabled
          ? "flag.enabled"
          : "flag.disabled"
        : scope.flag.rolloutPercentage !== config.rolloutPercentage
          ? "rollout.updated"
          : "flag.updated"
      : "flag.updated";

    if (config) {
      await this.publishConfig(tx, context, scope, config, action);
    }

    if (payload.rules) {
      await this.publishRules(tx, context, scope, payload.rules.rules);
    }

    if (payload.targets) {
      await this.publishTargets(tx, context, scope, payload.targets.targets);
    }
  }

  private async resolveApprovedChange(
    context: FlagsActorContext,
    projectKey: string,
    flagKey: string,
    environmentKey: string,
    payload: FlagChangePayload,
  ): Promise<EnvironmentScope> {
    const scope = await this.environmentScope(
      context,
      projectKey,
      environmentKey,
      flagKey,
      "engineer",
    );

    if (payload.config) {
      await this.validateConfigInput(scope.flag, payload.config);
    }

    if (payload.rules) {
      await this.validateRules(scope, payload.rules);
    }

    if (payload.targets) {
      await this.validateTargets(scope, payload.targets);
    }

    return scope;
  }

  /**
   * The one flag every environment-scoped method starts from: the project gate,
   * the environment, and the flag row — which carries its own configuration.
   */
  private async environmentScope(
    context: FlagsActorContext,
    projectKey: string,
    environmentKey: string,
    flagKey: string,
    minimumRole: "viewer" | "engineer",
  ): Promise<EnvironmentScope> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole,
    });

    const environment = await this.requireEnvironment(
      project.id,
      environmentKey,
    );
    const flagRow = await this.requireFlag(project.id, environment.id, flagKey);

    return { project, flag: flagRow, environment };
  }

  private async loadDetail(
    row: FlagRow,
    environment: EnvironmentRef,
  ): Promise<FlagDetail> {
    const [variations, parts] = await Promise.all([
      this.repository.listVariations(row.id),
      this.repository.detailParts(row.id),
    ]);

    return toFlagDetail(row, environment, {
      variations,
      rules: parts.rules,
      targets: parts.targets,
    });
  }

  /**
   * The one place a flag is written into an environment it did not come from.
   * The caller has already decided that the copy is allowed.
   */
  private async copyFlag(
    tx: Transaction,
    input: {
      source: FlagRow;
      target: EnvironmentRef;
      projectId: string;
      author: string;
      reason: string;
    },
  ): Promise<string> {
    const newFlagId = await this.repository.copyFlagIntoEnvironment(tx, {
      sourceFlagId: input.source.id,
      targetEnvironmentId: input.target.id,
    });

    await this.repository.insertVersion(tx, {
      flagId: newFlagId,
      projectId: input.projectId,
      version: 1,
      description: input.reason,
      author: input.author,
      snapshot: {
        environment: input.target.key,
        key: input.source.key,
        type: input.source.type,
      },
    });

    return newFlagId;
  }

  /**
   * A protected environment refuses direct publishes. The caller proposes the
   * change instead, and a second person approves it through the change-requests
   * module, which re-enters through `publishApprovedChange`.
   */
  private assertPublishable(environment: EnvironmentRef): void {
    if (environment.isProtected) {
      throw ApiError.approvalRequired(environment.key);
    }
  }

  private async validateConfigInput(
    row: FlagRow,
    input: UpdateFlagConfigInput,
  ): Promise<void> {
    const variationKeys = new Set(input.variations.map((v) => v.key));

    const mismatched = input.variations.find(
      (variation) =>
        !variationValueMatchesType(row.type as FlagType, variation.value),
    );

    if (mismatched) {
      throw ApiError.badRequest(
        `The value of "${mismatched.key}" is not a ${row.type}. A flag serves values of the type it was created with.`,
      );
    }

    for (const [field, key] of [
      ["defaultVariation", input.defaultVariation],
      ["offVariation", input.offVariation],
    ] as const) {
      if (!variationKeys.has(key)) {
        throw ApiError.badRequest(
          `"${key}" is not one of the flag's variations for this environment (${field}).`,
        );
      }
    }
  }

  private async validateRules(
    scope: EnvironmentScope,
    input: ReplaceTargetingRulesInput,
  ): Promise<void> {
    const known = new Set(
      (await this.repository.listVariations(scope.flag.id)).map(
        (variation) => variation.key,
      ),
    );

    for (const rule of input.rules) {
      if (!known.has(rule.variation)) {
        throw ApiError.badRequest(
          `"${rule.variation}" is not one of the flag's variations in this environment.`,
        );
      }
    }

    const segmentKeys = [
      ...new Set(input.rules.flatMap((rule) => rule.segmentKeys)),
    ];
    const unknownSegments = await this.findUnknownSegments(
      scope.project.id,
      segmentKeys,
    );

    if (unknownSegments.length > 0) {
      throw ApiError.badRequest(
        `Unknown segment${unknownSegments.length > 1 ? "s" : ""}: ${unknownSegments.join(", ")}.`,
      );
    }
  }

  private async validateTargets(
    scope: EnvironmentScope,
    input: ReplaceIndividualTargetsInput,
  ): Promise<void> {
    const known = new Set(
      (await this.repository.listVariations(scope.flag.id)).map(
        (variation) => variation.key,
      ),
    );

    for (const target of input.targets) {
      if (!known.has(target.variationKey)) {
        throw ApiError.badRequest(
          `"${target.variationKey}" is not one of the flag's variations in this environment.`,
        );
      }
    }
  }

  private async publishConfig(
    tx: Transaction,
    context: FlagsActorContext,
    scope: EnvironmentScope,
    input: UpdateFlagConfigInput,
    action: AuditAction,
  ): Promise<void> {
    const { flag, project, environment } = scope;

    await this.repository.updateConfig(tx, flag.id, input);
    await this.repository.replaceVariations(tx, flag.id, input.variations);

    await writeAuditLog(tx, {
      organizationId: context.organizationId,
      projectId: project.id,
      environmentId: environment.id,
      actor: context.userId,
      actorName: context.userName,
      action,
      target: flag.id,
      changes: {
        environment: environment.key,
        enabled: input.enabled,
        defaultVariation: input.defaultVariation,
        rolloutPercentage: input.rolloutPercentage,
      },
    });

    await this.repository.insertVersion(tx, {
      flagId: flag.id,
      projectId: project.id,
      version: await this.repository.nextVersion(tx, flag.id),
      description: `Configuration published to ${environment.name}`,
      author: context.userId,
      snapshot: {
        environment: environment.key,
        enabled: input.enabled,
        serve: input.defaultVariation,
        variations: input.variations,
      },
    });
  }

  private async publishRules(
    tx: Transaction,
    context: FlagsActorContext,
    scope: EnvironmentScope,
    rules: TargetingRuleInput[],
  ): Promise<void> {
    const { flag, project, environment } = scope;

    await this.repository.replaceRules(tx, flag.id, rules);

    await writeAuditLog(tx, {
      organizationId: context.organizationId,
      projectId: project.id,
      environmentId: environment.id,
      actor: context.userId,
      actorName: context.userName,
      action: "flag.updated",
      target: flag.id,
      changes: { environment: environment.key, rules },
    });

    await this.repository.insertVersion(tx, {
      flagId: flag.id,
      projectId: project.id,
      version: await this.repository.nextVersion(tx, flag.id),
      description: `Targeting rules published to ${environment.name}`,
      author: context.userId,
      snapshot: { environment: environment.key, rules },
    });
  }

  private async publishTargets(
    tx: Transaction,
    context: FlagsActorContext,
    scope: EnvironmentScope,
    targets: FlagIndividualTarget[],
  ): Promise<void> {
    const { flag, project, environment } = scope;

    await this.repository.replaceTargets(tx, flag.id, targets);

    await writeAuditLog(tx, {
      organizationId: context.organizationId,
      projectId: project.id,
      environmentId: environment.id,
      actor: context.userId,
      actorName: context.userName,
      action: "flag.updated",
      target: flag.id,
      changes: { environment: environment.key, targets },
    });

    await this.repository.insertVersion(tx, {
      flagId: flag.id,
      projectId: project.id,
      version: await this.repository.nextVersion(tx, flag.id),
      description: `Individual targets published to ${environment.name}`,
      author: context.userId,
      snapshot: { environment: environment.key, targets },
    });
  }

  private async requireFlag(
    projectId: string,
    environmentId: string,
    flagKey: string,
  ): Promise<FlagRow> {
    const row = await this.repository.findByKey(
      projectId,
      environmentId,
      flagKey,
    );

    if (!row) {
      throw ApiError.notFound("Flag not found.");
    }

    return row;
  }

  private async requireEnvironment(
    projectId: string,
    environmentKey: string,
  ): Promise<EnvironmentRef> {
    const environment = await this.repository.findEnvironmentByKey(
      projectId,
      environmentKey,
    );

    if (!environment) {
      throw ApiError.notFound("Environment not found.");
    }

    return environment;
  }
}
