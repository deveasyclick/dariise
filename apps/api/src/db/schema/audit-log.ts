import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { organization } from "./organization.js";

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    /** The project the action belongs to; null for workspace-level events. */
    projectId: text("project_id"),
    environmentId: text("environment_id"),
    action: text("action").notNull(),
    /** Free-form actor identifier: a user id or an API key id. */
    actor: text("actor").notNull(),
    target: text("target"),
    changes: jsonb("changes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_log_organization_created_idx").on(
      table.organizationId,
      table.createdAt,
    ),
    index("audit_log_action_idx").on(table.action),
    index("audit_log_project_created_idx").on(
      table.projectId,
      table.createdAt,
    ),
  ],
);
