import { and, desc, eq, lt, or } from "drizzle-orm";

import { db } from "../../db/client.js";
import { environment, flag, flagChangeRequest } from "../../db/schema/index.js";
import type { Transaction } from "../../shared/types/db.js";
import type {
  ChangeRequestDecision,
  ChangeRequestDetailRow,
  ChangeRequestListFilter,
  ChangeRequestRow,
  NewChangeRequestRecord,
} from "./change-requests.types.js";

const detailColumns = {
  id: flagChangeRequest.id,
  projectId: flagChangeRequest.projectId,
  environmentId: flagChangeRequest.environmentId,
  flagId: flagChangeRequest.flagId,
  status: flagChangeRequest.status,
  payload: flagChangeRequest.payload,
  requestedBy: flagChangeRequest.requestedBy,
  requestedByName: flagChangeRequest.requestedByName,
  decidedBy: flagChangeRequest.decidedBy,
  decidedByName: flagChangeRequest.decidedByName,
  decidedAt: flagChangeRequest.decidedAt,
  decisionNote: flagChangeRequest.decisionNote,
  createdAt: flagChangeRequest.createdAt,
  updatedAt: flagChangeRequest.updatedAt,
  flagKey: flag.key,
  environmentKey: environment.key,
  environmentName: environment.name,
};

export class ChangeRequestsRepository {
  async findFlag(
    projectId: string,
    key: string,
  ): Promise<{ id: string; key: string } | null> {
    const rows = await db
      .select({ id: flag.id, key: flag.key })
      .from(flag)
      .where(and(eq(flag.projectId, projectId), eq(flag.key, key)))
      .limit(1);

    return rows[0] ?? null;
  }

  async findEnvironment(
    projectId: string,
    key: string,
  ): Promise<{ id: string; key: string; name: string } | null> {
    const rows = await db
      .select({
        id: environment.id,
        key: environment.key,
        name: environment.name,
      })
      .from(environment)
      .where(
        and(eq(environment.projectId, projectId), eq(environment.key, key)),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async list(
    projectId: string,
    flagId: string,
    filter: ChangeRequestListFilter,
  ): Promise<ChangeRequestDetailRow[]> {
    const conditions = [
      eq(flagChangeRequest.projectId, projectId),
      eq(flagChangeRequest.flagId, flagId),
    ];

    if (filter.status) {
      conditions.push(eq(flagChangeRequest.status, filter.status));
    }

    if (filter.environmentKey) {
      conditions.push(eq(environment.key, filter.environmentKey));
    }

    if (filter.cursor) {
      conditions.push(
        or(
          lt(flagChangeRequest.createdAt, filter.cursor.createdAt),
          and(
            eq(flagChangeRequest.createdAt, filter.cursor.createdAt),
            lt(flagChangeRequest.id, filter.cursor.id),
          ),
        )!,
      );
    }

    return db
      .select(detailColumns)
      .from(flagChangeRequest)
      .innerJoin(flag, eq(flag.id, flagChangeRequest.flagId))
      .innerJoin(
        environment,
        eq(environment.id, flagChangeRequest.environmentId),
      )
      .where(and(...conditions))
      .orderBy(desc(flagChangeRequest.createdAt), desc(flagChangeRequest.id))
      .limit(filter.limit + 1);
  }

  async findById(
    projectId: string,
    id: string,
  ): Promise<ChangeRequestDetailRow | null> {
    const rows = await db
      .select(detailColumns)
      .from(flagChangeRequest)
      .innerJoin(flag, eq(flag.id, flagChangeRequest.flagId))
      .innerJoin(
        environment,
        eq(environment.id, flagChangeRequest.environmentId),
      )
      .where(
        and(
          eq(flagChangeRequest.projectId, projectId),
          eq(flagChangeRequest.id, id),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  /** The single pending request for a flag in an environment, if there is one. */
  async findPending(
    flagId: string,
    environmentId: string,
  ): Promise<ChangeRequestRow | null> {
    const rows = await db
      .select()
      .from(flagChangeRequest)
      .where(
        and(
          eq(flagChangeRequest.flagId, flagId),
          eq(flagChangeRequest.environmentId, environmentId),
          eq(flagChangeRequest.status, "pending"),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  /**
   * Retires the pending request this one replaces.
   *
   * The partial unique index is the real guarantee that one stays pending; this
   * makes the replacement explicit rather than a write that fails on the index.
   */
  async supersedePending(
    tx: Transaction,
    flagId: string,
    environmentId: string,
  ): Promise<void> {
    await tx
      .update(flagChangeRequest)
      .set({ status: "superseded", updatedAt: new Date() })
      .where(
        and(
          eq(flagChangeRequest.flagId, flagId),
          eq(flagChangeRequest.environmentId, environmentId),
          eq(flagChangeRequest.status, "pending"),
        ),
      );
  }

  async insert(tx: Transaction, record: NewChangeRequestRecord): Promise<void> {
    await tx.insert(flagChangeRequest).values(record);
  }

  /**
   * Moves a request out of `pending`, but only for the caller that won the
   * race: a second reviewer deciding the same request changes nothing.
   */
  async decide(
    tx: Transaction,
    id: string,
    status: "approved" | "rejected",
    decision: ChangeRequestDecision,
  ): Promise<boolean> {
    const decided = await tx
      .update(flagChangeRequest)
      .set({
        status,
        decidedBy: decision.decidedBy,
        decidedByName: decision.decidedByName,
        decidedAt: new Date(),
        decisionNote: decision.decisionNote,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(flagChangeRequest.id, id),
          eq(flagChangeRequest.status, "pending"),
        ),
      )
      .returning({ id: flagChangeRequest.id });

    return decided.length > 0;
  }
}
