import { and, eq } from "drizzle-orm";

import { db } from "../../db/client.js";
import { environment, project, userPreferences } from "../../db/schema/index.js";
import type { EnvironmentRef, PreferencesPatch, PreferencesRow } from "./account.types.js";

export class AccountRepository {
  async findPreferences(userId: string): Promise<PreferencesRow | null> {
    const rows = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    return rows[0] ?? null;
  }

  /** Preferences are a per-user singleton row, so the first write creates it. */
  async upsertPreferences(
    userId: string,
    patch: PreferencesPatch,
  ): Promise<PreferencesRow> {
    const rows = await db
      .insert(userPreferences)
      .values({ userId, ...patch })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { ...patch, updatedAt: new Date() },
      })
      .returning();

    const row = rows[0];

    if (!row) {
      throw new Error("The preferences upsert returned no row.");
    }

    return row;
  }

  /**
   * Resolves an environment key inside the caller's workspace. The workspace is
   * a parameter rather than a path segment, so a foreign key never resolves.
   */
  async findEnvironmentByKey(
    organizationId: string,
    key: string,
  ): Promise<EnvironmentRef | null> {
    const rows = await db
      .select({ id: environment.id, key: environment.key })
      .from(environment)
      .innerJoin(project, eq(project.id, environment.projectId))
      .where(
        and(eq(project.organizationId, organizationId), eq(environment.key, key)),
      )
      .limit(1);

    return rows[0] ?? null;
  }
}
