import { randomUUID } from "node:crypto";

import { toWorkspaceSlug, type CreateProjectInput } from "@dariise/contracts";

import { writeAuditLog } from "../../db/audit.js";
import { db } from "../../db/client.js";
import { ApiError } from "../../shared/http/errors.js";
import type { Transaction } from "../../shared/types/db.js";
import type { ProjectsRepository } from "./projects.repository.js";
import type { ProjectRow } from "./projects.types.js";

/** Bounded so a crowded namespace fails fast instead of probing forever. */
const MAX_KEY_SUFFIX = 50;

export class ProjectsService {
  constructor(private readonly repository: ProjectsRepository) {}

  async create(
    organizationId: string,
    actor: string,
    input: CreateProjectInput,
  ): Promise<ProjectRow> {
    return db.transaction(async (tx) => {
      const key = await this.resolveKey(tx, organizationId, input.name);

      const created = {
        id: randomUUID(),
        key,
        name: input.name,
        environmentName: input.environmentName,
      };

      await this.repository.insert(tx, { organizationId, ...created });

      await writeAuditLog(tx, {
        organizationId,
        actor,
        action: "project.created",
        target: created.id,
        changes: created,
      });

      return created;
    });
  }

  async hasProject(organizationId: string): Promise<boolean> {
    return (await this.repository.countForOrganization(organizationId)) > 0;
  }

  /** Derives a workspace-unique key, suffixing rather than failing. */
  private async resolveKey(
    tx: Transaction,
    organizationId: string,
    name: string,
  ): Promise<string> {
    const base = toWorkspaceSlug(name) || "project";

    if (!(await this.repository.findByKey(tx, organizationId, base))) {
      return base;
    }

    for (let suffix = 2; suffix <= MAX_KEY_SUFFIX; suffix += 1) {
      const candidate = `${base}-${suffix}`;

      if (!(await this.repository.findByKey(tx, organizationId, candidate))) {
        return candidate;
      }
    }

    throw ApiError.badRequest(
      "Too many projects share that name. Choose a different one.",
    );
  }
}
