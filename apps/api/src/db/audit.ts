import { randomUUID } from "node:crypto";

import type { AuditEntry } from "../shared/types/audit.js";
import type { Transaction } from "../shared/types/db.js";
import { auditLog } from "./schema/index.js";

// Callers pass their mutation's transaction: the row and the change it describes
// must commit together, or the entry is lost when the process dies in between.
export async function writeAuditLog(
  tx: Transaction,
  entry: AuditEntry,
): Promise<void> {
  await tx.insert(auditLog).values({
    id: randomUUID(),
    organizationId: entry.organizationId,
    environmentId: entry.environmentId ?? null,
    action: entry.action,
    actor: entry.actor,
    target: entry.target ?? null,
    changes: entry.changes ?? null,
  });
}
