import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { environment } from "./environments.js";
import { flag } from "./flags.js";
import { project } from "./project.js";

export const flagChangeRequest = pgTable(
  "flag_change_requests",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    environmentId: text("environment_id")
      .notNull()
      .references(() => environment.id, { onDelete: "cascade" }),
    flagId: text("flag_id")
      .notNull()
      .references(() => flag.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    payload: jsonb("payload").notNull(),
    requestedBy: text("requested_by").notNull(),
    requestedByName: text("requested_by_name"),
    decidedBy: text("decided_by"),
    decidedByName: text("decided_by_name"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decisionNote: text("decision_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("flag_change_request_pending_idx")
      .on(table.flagId, table.environmentId)
      .where(sql`${table.status} = 'pending'`),
    index("flag_change_request_project_idx").on(
      table.projectId,
      table.createdAt.desc(),
    ),
  ],
);
