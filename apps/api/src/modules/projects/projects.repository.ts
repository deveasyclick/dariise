import { and, asc, count, eq, ilike, or } from "drizzle-orm";

import { db } from "../../db/client.js";
import { environment, project, projectMember } from "../../db/schema/index.js";
import type { Transaction } from "../../shared/types/db.js";
import type {
  EnvironmentRef,
  NewProject,
  ProjectDetailRow,
  ProjectRow,
  UpdateProjectRecord,
} from "./projects.types.js";

const detailColumns = {
  id: project.id,
  key: project.key,
  name: project.name,
  description: project.description,
  color: project.color,
  ownerTeam: project.ownerTeam,
  environmentName: project.environmentName,
  defaultEnvironmentId: project.defaultEnvironmentId,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
};

export class ProjectsRepository {
  async findByKey(
    tx: Transaction,
    organizationId: string,
    key: string,
  ): Promise<ProjectRow | null> {
    const rows = await this.selectByKey(tx, organizationId, key);

    return rows[0] ?? null;
  }

  async countForOrganization(organizationId: string): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(project)
      .where(eq(project.organizationId, organizationId));

    return row?.value ?? 0;
  }

  async insert(tx: Transaction, input: NewProject): Promise<void> {
    await tx.insert(project).values(input);
  }

  /** The workspace list: one query, with the environment count per project. */
  async list(
    organizationId: string,
    search?: string,
  ): Promise<ProjectDetailRow[]> {
    const conditions = [eq(project.organizationId, organizationId)];

    if (search) {
      const pattern = `%${search}%`;
      const match = or(ilike(project.key, pattern), ilike(project.name, pattern));

      if (match) conditions.push(match);
    }

    return db
      .select({
        ...detailColumns,
        environmentCount: count(environment.id),
      })
      .from(project)
      .leftJoin(environment, eq(environment.projectId, project.id))
      .where(and(...conditions))
      .groupBy(project.id)
      .orderBy(asc(project.key));
  }

  async findDetailByKey(
    organizationId: string,
    key: string,
  ): Promise<ProjectDetailRow | null> {
    const rows = await db
      .select({
        ...detailColumns,
        environmentCount: count(environment.id),
      })
      .from(project)
      .leftJoin(environment, eq(environment.projectId, project.id))
      .where(
        and(eq(project.organizationId, organizationId), eq(project.key, key)),
      )
      .groupBy(project.id)
      .limit(1);

    return rows[0] ?? null;
  }

  async update(
    tx: Transaction,
    id: string,
    patch: UpdateProjectRecord,
  ): Promise<void> {
    await tx
      .update(project)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(project.id, id));
  }

  /** Resolves an environment key inside one project, so a foreign key cannot match. */
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

  /**
   * The creator becomes the project's explicit owner, so the members screen
   * lists somebody and the owner's rights do not depend on the workspace role.
   */
  async insertOwner(
    tx: Transaction,
    record: { id: string; projectId: string; userId: string },
  ): Promise<void> {
    await tx
      .insert(projectMember)
      .values({ ...record, role: "owner" });
  }

  private async selectByKey(
    tx: Transaction,
    organizationId: string,
    key: string,
  ): Promise<ProjectRow[]> {
    return tx
      .select({
        id: project.id,
        key: project.key,
        name: project.name,
        environmentName: project.environmentName,
      })
      .from(project)
      .where(
        and(eq(project.organizationId, organizationId), eq(project.key, key)),
      )
      .limit(1);
  }
}
