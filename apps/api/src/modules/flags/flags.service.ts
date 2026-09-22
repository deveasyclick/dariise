import { randomUUID } from "node:crypto";

import type {
  CreateFlagInput,
  FlagDependencyGraph,
  FlagDetail,
  FlagEnvironmentConfig,
  FlagIndividualTarget,
  FlagListQuery,
  FlagSummary,
  FlagVariation,
  FlagVersion,
  ReplaceIndividualTargetsInput,
  ReplaceTargetingRulesInput,
  TargetingRule,
  UpdateFlagConfigInput,
  UpdateFlagInput,
  WorkspaceFlagListQuery,
  WorkspaceFlagSummary,
} from "@dariise/contracts";

import { writeAuditLog } from "../../db/audit.js";
import { db } from "../../db/client.js";
import { ApiError } from "../../shared/http/errors.js";
import { decodeCursor, toPage } from "../../shared/pagination.js";
import type { Page } from "../../shared/types/pagination.js";
import type { ProjectAccessService } from "../project-access/index.js";
import { buildDependencyGraph } from "./flags.dependencies.js";
import {
  toFlagDetail,
  toFlagSummary,
  toFlagVersion,
  toIndividualTargets,
  toTargetingRule,
  toVariation,
  toWorkspaceFlagSummary,
} from "./flags.mapper.js";
import type { FlagsRepository } from "./flags.repository.js";
import {
  WORKSPACE_FLAG_CURSOR_SEPARATOR,
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

    const rows = await this.repository.list(project.id, {
      search: query.search,
      status: query.status,
      limit: query.limit,
      // The cursor is opaque base64url; the repository compares real keys.
      cursor: decodeCursor(query.cursor),
    });

    const page = toPage(rows, query.limit, (row) => row.key);
    const configs = await this.repository.listConfigSummaries(
      page.data.map((row) => row.id),
    );

    return {
      data: page.data.map((row) => toFlagSummary(row, configs)),
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

    if (await this.repository.findByKey(project.id, input.key)) {
      throw ApiError.conflict("A flag with that key already exists.");
    }

    const flagId = randomUUID();

    await db.transaction(async (tx) => {
      await this.repository.insert(tx, {
        id: flagId,
        projectId: project.id,
        key: input.key,
        name: input.name,
        description: input.description ?? null,
        type: input.type,
        tags: input.tags,
        owner: input.owner ?? null,
      });

      // A flag is configuration per environment, so every environment the
      // project has gets its own off-by-default config.
      const environments = await this.repository.listEnvironments(project.id);

      for (const environment of environments) {
        await this.repository.insertEnvironmentConfig(tx, {
          flagId,
          environmentId: environment.id,
        });
      }

      await writeAuditLog(tx, {
        organizationId: context.organizationId,
        projectId: project.id,
        actor: context.userId,
        action: "flag.created",
        target: flagId,
        changes: { key: input.key, name: input.name, type: input.type },
      });

      await this.repository.insertVersion(tx, {
        flagId,
        projectId: project.id,
        version: await this.repository.nextVersion(tx, flagId),
        description: "Flag created",
        author: context.userId,
        snapshot: { key: input.key, type: input.type, tags: input.tags },
      });
    });

    return this.loadDetail(project.id, input.key);
  }

  async get(
    context: FlagsActorContext,
    projectKey: string,
    flagKey: string,
  ): Promise<FlagDetail> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole: "viewer",
    });

    return this.loadDetail(project.id, flagKey);
  }

  async update(
    context: FlagsActorContext,
    projectKey: string,
    flagKey: string,
    input: UpdateFlagInput,
  ): Promise<FlagDetail> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole: "engineer",
    });

    const row = await this.requireFlag(project.id, flagKey);

    await db.transaction(async (tx) => {
      await this.repository.update(tx, row.id, input);

      await writeAuditLog(tx, {
        organizationId: context.organizationId,
        projectId: project.id,
        actor: context.userId,
        action: "flag.updated",
        target: row.id,
        changes: input,
      });
    });

    return this.loadDetail(project.id, flagKey);
  }

  async archive(
    context: FlagsActorContext,
    projectKey: string,
    flagKey: string,
  ): Promise<{ key: string; status: string }> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      // The ADR-0004 matrix lets an engineer archive a flag.
      minimumRole: "engineer",
    });

    const row = await this.requireFlag(project.id, flagKey);

    await db.transaction(async (tx) => {
      await this.repository.archive(tx, row.id);

      await writeAuditLog(tx, {
        organizationId: context.organizationId,
        projectId: project.id,
        actor: context.userId,
        action: "flag.archived",
        target: row.id,
        changes: { status: "archived" },
      });
    });

    return { key: row.key, status: "archived" };
  }

  async getEnvironmentConfig(
    context: FlagsActorContext,
    projectKey: string,
    flagKey: string,
    environmentKey: string,
  ): Promise<FlagEnvironmentConfig> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole: "viewer",
    });

    const row = await this.requireFlag(project.id, flagKey);
    const environment = await this.requireEnvironment(project.id, environmentKey);

    return this.loadEnvironmentConfig(row.id, environment);
  }

  async updateEnvironmentConfig(
    context: FlagsActorContext,
    projectKey: string,
    flagKey: string,
    environmentKey: string,
    input: UpdateFlagConfigInput,
  ): Promise<FlagEnvironmentConfig> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole: "engineer",
    });

    const row = await this.requireFlag(project.id, flagKey);
    const environment = await this.requireEnvironment(project.id, environmentKey);
    const config = await this.repository.findConfig(row.id, environment.id);

    if (!config) {
      throw ApiError.notFound("That flag is not configured for this environment.");
    }

    const variationKeys = new Set(input.variations.map((v) => v.key));

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

    const action =
      config.enabled !== input.enabled
        ? input.enabled
          ? "flag.enabled"
          : "flag.disabled"
        : config.rolloutPercentage !== input.rolloutPercentage
          ? "rollout.updated"
          : "flag.updated";

    await db.transaction(async (tx) => {
      await this.repository.updateConfig(tx, row.id, environment.id, input);
      await this.repository.replaceVariations(
        tx,
        row.id,
        environment.id,
        input.variations,
      );

      await writeAuditLog(tx, {
        organizationId: context.organizationId,
        projectId: project.id,
        environmentId: environment.id,
        actor: context.userId,
        action,
        target: row.id,
        changes: {
          environment: environment.key,
          enabled: input.enabled,
          defaultVariation: input.defaultVariation,
          rolloutPercentage: input.rolloutPercentage,
        },
      });

      await this.repository.insertVersion(tx, {
        flagId: row.id,
        projectId: project.id,
        version: await this.repository.nextVersion(tx, row.id),
        description: `Configuration published to ${environment.name}`,
        author: context.userId,
        snapshot: {
          environment: environment.key,
          enabled: input.enabled,
          serve: input.defaultVariation,
          variations: input.variations,
        },
      });
    });

    return this.loadEnvironmentConfig(row.id, environment, input);
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
        limit: query.limit,
        cursor: decodeCursor(query.cursor),
      },
    );

    const page = toPage(
      rows,
      query.limit,
      (row) => `${row.projectKey}${WORKSPACE_FLAG_CURSOR_SEPARATOR}${row.key}`,
    );

    const configs = await this.repository.listConfigSummaries(
      page.data.map((row) => row.id),
    );

    return {
      data: page.data.map((row) =>
        toWorkspaceFlagSummary(row, row.projectKey, configs),
      ),
      nextCursor: page.nextCursor,
    };
  }

  /** `GET /v1/flags/:flagKey` requires a project key: keys collide across projects. */
  async resolve(
    context: FlagsActorContext,
    flagKey: string,
    projectKey: string,
  ): Promise<FlagDetail> {
    return this.get(context, projectKey, flagKey);
  }

  async getRules(
    context: FlagsActorContext,
    projectKey: string,
    flagKey: string,
    environmentKey: string,
  ): Promise<TargetingRule[]> {
    const scope = await this.environmentScope(
      context,
      projectKey,
      flagKey,
      environmentKey,
      "viewer",
    );

    const rules = await this.repository.listRules(scope.flag.id);

    return rules
      .filter((entry) => entry.rule.environmentId === scope.environment.id)
      .map(toTargetingRule);
  }

  async replaceRules(
    context: FlagsActorContext,
    projectKey: string,
    flagKey: string,
    environmentKey: string,
    input: ReplaceTargetingRulesInput,
  ): Promise<TargetingRule[]> {
    const scope = await this.environmentScope(
      context,
      projectKey,
      flagKey,
      environmentKey,
      "engineer",
    );

    const known = new Set(
      (await this.repository.listVariations(scope.flag.id, scope.environment.id))
        .map((variation) => variation.key),
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

    await db.transaction(async (tx) => {
      await this.repository.replaceRules(
        tx,
        scope.flag.id,
        scope.environment.id,
        input.rules,
      );

      await writeAuditLog(tx, {
        organizationId: context.organizationId,
        projectId: scope.project.id,
        environmentId: scope.environment.id,
        actor: context.userId,
        action: "flag.updated",
        target: scope.flag.id,
        changes: { environment: scope.environment.key, rules: input.rules },
      });

      await this.repository.insertVersion(tx, {
        flagId: scope.flag.id,
        projectId: scope.project.id,
        version: await this.repository.nextVersion(tx, scope.flag.id),
        description: `Targeting rules published to ${scope.environment.name}`,
        author: context.userId,
        snapshot: { environment: scope.environment.key, rules: input.rules },
      });
    });

    const rules = await this.repository.listRules(scope.flag.id);

    return rules
      .filter((entry) => entry.rule.environmentId === scope.environment.id)
      .map(toTargetingRule);
  }

  async getTargets(
    context: FlagsActorContext,
    projectKey: string,
    flagKey: string,
    environmentKey: string,
  ): Promise<FlagIndividualTarget[]> {
    const scope = await this.environmentScope(
      context,
      projectKey,
      flagKey,
      environmentKey,
      "viewer",
    );

    const targets = await this.repository.listTargets(scope.flag.id);

    return toIndividualTargets(
      targets.filter((target) => target.environmentId === scope.environment.id),
    );
  }

  async replaceTargets(
    context: FlagsActorContext,
    projectKey: string,
    flagKey: string,
    environmentKey: string,
    input: ReplaceIndividualTargetsInput,
  ): Promise<FlagIndividualTarget[]> {
    const scope = await this.environmentScope(
      context,
      projectKey,
      flagKey,
      environmentKey,
      "engineer",
    );

    const known = new Set(
      (await this.repository.listVariations(scope.flag.id, scope.environment.id))
        .map((variation) => variation.key),
    );

    for (const target of input.targets) {
      if (!known.has(target.variationKey)) {
        throw ApiError.badRequest(
          `"${target.variationKey}" is not one of the flag's variations in this environment.`,
        );
      }
    }

    await db.transaction(async (tx) => {
      await this.repository.replaceTargets(
        tx,
        scope.flag.id,
        scope.environment.id,
        input.targets,
      );

      await writeAuditLog(tx, {
        organizationId: context.organizationId,
        projectId: scope.project.id,
        environmentId: scope.environment.id,
        actor: context.userId,
        action: "flag.updated",
        target: scope.flag.id,
        changes: { environment: scope.environment.key, targets: input.targets },
      });

      await this.repository.insertVersion(tx, {
        flagId: scope.flag.id,
        projectId: scope.project.id,
        version: await this.repository.nextVersion(tx, scope.flag.id),
        description: `Individual targets published to ${scope.environment.name}`,
        author: context.userId,
        snapshot: { environment: scope.environment.key, targets: input.targets },
      });
    });

    const targets = await this.repository.listTargets(scope.flag.id);

    return toIndividualTargets(
      targets.filter((target) => target.environmentId === scope.environment.id),
    );
  }

  async getDependencies(
    context: FlagsActorContext,
    projectKey: string,
    flagKey: string,
  ): Promise<FlagDependencyGraph> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole: "viewer",
    });

    await this.requireFlag(project.id, flagKey);

    const rows = await this.repository.listDependencies(project.id, flagKey);
    const keys = new Set<string>([flagKey]);

    for (const row of rows) {
      keys.add(row.key);
      keys.add(row.requires);
    }

    const statuses = await this.repository.findStatuses(project.id, [...keys]);

    return buildDependencyGraph(flagKey, rows, statuses);
  }

  async listVersions(
    context: FlagsActorContext,
    projectKey: string,
    flagKey: string,
    limit: number,
    cursor: string | undefined,
  ): Promise<Page<FlagVersion>> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole: "viewer",
    });

    const row = await this.requireFlag(project.id, flagKey);
    const rows = await this.repository.listVersions(
      row.id,
      limit,
      decodeCursor(cursor),
    );

    const page = toPage(rows, limit, (version) => String(version.version));

    return {
      data: page.data.map((version) => toFlagVersion(version)),
      nextCursor: page.nextCursor,
    };
  }

  private async environmentScope(
    context: FlagsActorContext,
    projectKey: string,
    flagKey: string,
    environmentKey: string,
    minimumRole: "viewer" | "engineer",
  ) {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole,
    });

    const flagRow = await this.requireFlag(project.id, flagKey);
    const environment = await this.requireEnvironment(
      project.id,
      environmentKey,
    );
    const config = await this.repository.findConfig(flagRow.id, environment.id);

    if (!config) {
      throw ApiError.notFound(
        "That flag is not configured for this environment.",
      );
    }

    return { project, flag: flagRow, environment, config };
  }

  private async loadDetail(
    projectId: string,
    flagKey: string,
  ): Promise<FlagDetail> {
    const row = await this.requireFlag(projectId, flagKey);
    const environments = await this.repository.detailForFlag(row.id);

    return toFlagDetail(row, environments);
  }

  private async loadEnvironmentConfig(
    flagId: string,
    environment: { id: string; key: string; name: string },
    override?: UpdateFlagConfigInput,
  ): Promise<FlagEnvironmentConfig> {
    const config = override
      ? {
          enabled: override.enabled,
          offVariationKey: override.offVariation,
          defaultVariationKey: override.defaultVariation,
          rolloutPercentage: override.rolloutPercentage,
          bucketBy: override.bucketBy,
        }
      : await this.repository.findConfig(flagId, environment.id);

    if (!config) {
      throw ApiError.notFound("That flag is not configured for this environment.");
    }

    const variations: FlagVariation[] = override
      ? override.variations
      : (await this.repository.listVariations(flagId, environment.id)).map(
          toVariation,
        );

    return {
      environmentKey: environment.key,
      environmentName: environment.name,
      enabled: config.enabled,
      offVariation: config.offVariationKey,
      defaultVariation: config.defaultVariationKey,
      rolloutPercentage: config.rolloutPercentage,
      bucketBy: config.bucketBy,
      variations,
      rules: [],
      individualTargets: [],
    };
  }

  private async requireFlag(projectId: string, flagKey: string) {
    const row = await this.repository.findByKey(projectId, flagKey);

    if (!row) {
      throw ApiError.notFound("Flag not found.");
    }

    return row;
  }

  private async requireEnvironment(projectId: string, environmentKey: string) {
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
