import { randomUUID } from "node:crypto";

import {
  toWorkspaceSlug,
  type CreateEnvironmentInput,
  type EnvironmentDetail,
  type EnvironmentSummary,
  type FlagCoveragePage,
  type InitialFlagState,
  type UpdateEnvironmentSettingsInput,
} from "@dariise/contracts";

import { writeAuditLog } from "../../db/audit.js";
import { db } from "../../db/client.js";
import { ApiError } from "../../shared/http/errors.js";
import { decodeCursor, toPage } from "../../shared/pagination.js";
import type { Page } from "../../shared/types/pagination.js";
import type { Transaction } from "../../shared/types/db.js";
import type { ProjectAccessService } from "../project-access/index.js";
import {
  toCoverageRows,
  toEnvironmentDetail,
  toEnvironmentSummary,
} from "./environments.mapper.js";
import type { EnvironmentsRepository } from "./environments.repository.js";
import {
  DEFAULT_ENVIRONMENT_SETTINGS,
  DEFAULT_ROLLOUT_BUCKET,
  DEFAULT_VARIATIONS,
  type EnvironmentActorContext,
  type EnvironmentConnectionUrls,
  type VariationRecord,
} from "./environments.types.js";

/**
 * Reads are viewer-level; creating or reconfiguring an environment needs the
 * project admin role the ADR-0004 matrix requires.
 */
export class EnvironmentsService {
  constructor(
    private readonly repository: EnvironmentsRepository,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async list(
    context: EnvironmentActorContext,
    projectKey: string,
    limit: number,
    cursor: string | undefined,
  ): Promise<Page<EnvironmentSummary>> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole: "viewer",
    });

    const rows = await this.repository.list(
      project.id,
      limit,
      decodeCursor(cursor),
    );
    const page = toPage(rows, limit, (row) => row.key);

    return {
      data: page.data.map(toEnvironmentSummary),
      nextCursor: page.nextCursor,
    };
  }

  async create(
    context: EnvironmentActorContext,
    projectKey: string,
    input: CreateEnvironmentInput,
    origin: string,
  ): Promise<EnvironmentDetail> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole: "admin",
    });

    if (await this.repository.findByKey(project.id, input.key)) {
      throw ApiError.conflict("An environment with that key already exists.");
    }

    const existing = await this.repository.countForProject(project.id);
    const source = await this.resolveSource(project.id, input);

    const id = randomUUID();

    await db.transaction(async (tx) => {
      await this.repository.insert(tx, {
        id,
        projectId: project.id,
        key: input.key,
        name: input.name,
        color: input.color ?? null,
        isDefault: existing === 0,
        isProtected: false,
        settings: DEFAULT_ENVIRONMENT_SETTINGS,
      });

      await this.seedFlagConfiguration(
        tx,
        project.id,
        id,
        source?.id ?? null,
        input.initialFlagStatus,
      );

      await writeAuditLog(tx, {
        organizationId: context.organizationId,
        projectId: project.id,
        actor: context.userId,
        action: "environment.created",
        target: id,
        changes: {
          key: input.key,
          name: input.name,
          copyFrom: source?.key ?? null,
          initialFlagStatus: input.initialFlagStatus,
        },
      });
    });

    return this.loadDetail(project.id, input.key, origin);
  }

  async get(
    context: EnvironmentActorContext,
    projectKey: string,
    environmentKey: string,
    origin: string,
  ): Promise<EnvironmentDetail> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole: "viewer",
    });

    return this.loadDetail(project.id, environmentKey, origin);
  }

  async updateSettings(
    context: EnvironmentActorContext,
    projectKey: string,
    environmentKey: string,
    input: UpdateEnvironmentSettingsInput,
    origin: string,
  ): Promise<EnvironmentDetail> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole: "admin",
    });

    const row = await this.requireEnvironment(project.id, environmentKey);

    await db.transaction(async (tx) => {
      await this.repository.updateSettings(tx, row.id, input);

      await writeAuditLog(tx, {
        organizationId: context.organizationId,
        projectId: project.id,
        environmentId: row.id,
        actor: context.userId,
        action: "environment.updated",
        target: row.id,
        changes: input,
      });
    });

    return this.loadDetail(project.id, environmentKey, origin);
  }

  async coverage(
    context: EnvironmentActorContext,
    projectKey: string,
    limit: number,
    cursor: string | undefined,
  ): Promise<FlagCoveragePage> {
    const { project } = await this.projectAccess.require({
      ...context,
      projectKey,
      minimumRole: "viewer",
    });

    const flags = await this.repository.listFlagPage(
      project.id,
      limit,
      decodeCursor(cursor),
    );
    const page = toPage(flags, limit, (row) => row.key);
    const environments = await this.repository.listAll(project.id);
    const configs = await this.repository.listCoverageConfigs(
      project.id,
      page.data.map((row) => row.id),
    );

    return {
      data: toCoverageRows(
        page.data,
        environments.map((environment) => environment.key),
        configs,
      ),
      nextCursor: page.nextCursor,
    };
  }

  /**
   * The first environment of a new project, created inside the project's
   * transaction so onboarding cannot strand a project with nowhere to put a flag.
   */
  async createDefault(
    tx: Transaction,
    projectId: string,
    name: string,
  ): Promise<void> {
    const id = randomUUID();
    const key = toWorkspaceSlug(name) || "development";

    await this.repository.insert(tx, {
      id,
      projectId,
      key,
      name,
      color: null,
      isDefault: true,
      isProtected: false,
      settings: DEFAULT_ENVIRONMENT_SETTINGS,
    });

    await this.seedFlagConfiguration(tx, projectId, id, null, "all-off");
  }

  private async loadDetail(
    projectId: string,
    environmentKey: string,
    origin: string,
  ): Promise<EnvironmentDetail> {
    const row = await this.requireEnvironment(projectId, environmentKey);
    const prefix = await this.repository.findUsableKeyPrefix(
      projectId,
      row.id,
    );

    const connection: EnvironmentConnectionUrls = {
      baseUrl: origin,
      evalUrl: `${origin}/v1/evaluate`,
      // Streaming is not implemented; the contract keeps this null until it is.
      streamUrl: null,
      maskedKey: prefix,
    };

    return toEnvironmentDetail(row, connection);
  }

  /** `copyFrom` wins; a bare copy-source falls back to the project's default. */
  private async resolveSource(
    projectId: string,
    input: CreateEnvironmentInput,
  ) {
    if (input.copyFrom) {
      const source = await this.repository.findByKey(
        projectId,
        input.copyFrom,
      );

      if (!source) {
        throw ApiError.notFound("The environment to copy from was not found.");
      }

      return source;
    }

    if (input.initialFlagStatus !== "copy-source") return null;

    const [first] = await this.repository.listAll(projectId);

    return first ?? null;
  }

  private async seedFlagConfiguration(
    tx: Transaction,
    projectId: string,
    environmentId: string,
    sourceEnvironmentId: string | null,
    initialFlagStatus: InitialFlagState,
  ): Promise<void> {
    const flags = await this.repository.listFlags(projectId);
    const sourceConfigs = sourceEnvironmentId
      ? await this.repository.listConfigs(sourceEnvironmentId)
      : [];
    const sourceVariations = sourceEnvironmentId
      ? await this.repository.listVariations(sourceEnvironmentId)
      : [];

    for (const flag of flags) {
      const source = sourceConfigs.find(
        (config) => config.flagId === flag.id,
      );
      const copy = initialFlagStatus === "copy-source" && source !== undefined;

      await this.repository.insertConfig(tx, {
        flagId: flag.id,
        environmentId,
        enabled: copy ? source.enabled : initialFlagStatus === "all-on",
        offVariationKey: copy ? source.offVariationKey : "off",
        defaultVariationKey: copy ? source.defaultVariationKey : "on",
        rolloutPercentage: copy ? source.rolloutPercentage : 0,
        bucketBy: copy ? source.bucketBy : DEFAULT_ROLLOUT_BUCKET,
      });

      const variations: VariationRecord[] = copy
        ? sourceVariations
            .filter((variation) => variation.flagId === flag.id)
            .map((variation) => ({ ...variation, environmentId }))
        : DEFAULT_VARIATIONS.map((variation) => ({
            flagId: flag.id,
            environmentId,
            key: variation.key,
            name: variation.name,
            value: variation.value,
            description: null,
            priority: variation.priority,
          }));

      await this.repository.insertVariations(tx, variations);
    }
  }

  private async requireEnvironment(projectId: string, key: string) {
    const row = await this.repository.findByKey(projectId, key);

    if (!row) {
      throw ApiError.notFound("Environment not found.");
    }

    return row;
  }
}
