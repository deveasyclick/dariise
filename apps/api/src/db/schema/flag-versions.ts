import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { flag } from "./flags.js";
import { project } from "./project.js";

// Written on every configuration publish; the history screen reads it.
export const flagVersion = pgTable(
  "flag_versions",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    flagId: text("flag_id")
      .notNull()
      .references(() => flag.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    description: text("description"),
    author: text("author").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("flag_version_flag_version_idx").on(
      table.flagId,
      table.version,
    ),
    index("flag_version_project_id_idx").on(table.projectId),
  ],
);
