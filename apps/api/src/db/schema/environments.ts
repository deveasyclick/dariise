import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { project } from "./project.js";

export const environment = pgTable(
  "environments",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    name: text("name").notNull(),
    color: text("color"),
    isDefault: boolean("is_default").notNull().default(false),
    isProtected: boolean("is_protected").notNull().default(false),
    settings: jsonb("settings")
      .notNull()
      .default({
        protectedEnvironment: false,
        requireApprovals: false,
        singleUseSdkKeys: false,
      }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("environment_project_key_idx").on(table.projectId, table.key),
    index("environment_project_id_idx").on(table.projectId),
  ],
);
