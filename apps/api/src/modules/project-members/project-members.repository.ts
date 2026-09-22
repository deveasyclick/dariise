import { and, asc, eq } from "drizzle-orm";

import { db } from "../../db/client.js";
import { member, projectMember, user } from "../../db/schema/index.js";
import type { Transaction } from "../../shared/types/db.js";
import type {
  NewProjectMemberRecord,
  ProjectMemberRow,
} from "./project-members.types.js";

const memberColumns = {
  id: projectMember.id,
  projectId: projectMember.projectId,
  userId: projectMember.userId,
  role: projectMember.role,
  createdAt: projectMember.createdAt,
  name: user.name,
  email: user.email,
};

export class ProjectMembersRepository {
  async list(projectId: string): Promise<ProjectMemberRow[]> {
    return db
      .select(memberColumns)
      .from(projectMember)
      .innerJoin(user, eq(user.id, projectMember.userId))
      .where(eq(projectMember.projectId, projectId))
      .orderBy(asc(projectMember.createdAt));
  }

  async find(
    projectId: string,
    userId: string,
  ): Promise<ProjectMemberRow | null> {
    const rows = await db
      .select(memberColumns)
      .from(projectMember)
      .innerJoin(user, eq(user.id, projectMember.userId))
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, userId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  /**
   * A project member must belong to the workspace first: a project row that
   * points at a stranger would be an authorization hole.
   */
  async isWorkspaceMember(
    organizationId: string,
    userId: string,
  ): Promise<boolean> {
    const rows = await db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.organizationId, organizationId),
          eq(member.userId, userId),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }

  async insert(
    tx: Transaction,
    record: NewProjectMemberRecord,
  ): Promise<void> {
    await tx.insert(projectMember).values(record);
  }

  async updateRole(
    tx: Transaction,
    projectId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    await tx
      .update(projectMember)
      .set({ role, updatedAt: new Date() })
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, userId),
        ),
      );
  }

  async remove(
    tx: Transaction,
    projectId: string,
    userId: string,
  ): Promise<boolean> {
    const removed = await tx
      .delete(projectMember)
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, userId),
        ),
      )
      .returning({ id: projectMember.id });

    return removed.length > 0;
  }
}
