import { eq } from "drizzle-orm";

import { db } from "../../db/client.js";
import { member, organization } from "../../db/schema/index.js";
import type { WorkspaceMembership } from "./auth.types.js";

export class AuthRepository {
  async findWorkspaceForUser(
    userId: string,
  ): Promise<WorkspaceMembership | null> {
    const rows = await this.selectWorkspace(userId);

    return rows[0] ?? null;
  }

  private async selectWorkspace(userId: string) {
    return db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        role: member.role,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, userId))
      .limit(1);
  }
}
