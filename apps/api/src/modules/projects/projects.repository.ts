import { and, count, eq } from "drizzle-orm";

import { db } from "../../db/client.js";
import { project } from "../../db/schema/index.js";
import type { Transaction } from "../../shared/types/db.js";
import type { NewProject, ProjectRow } from "./projects.types.js";

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
