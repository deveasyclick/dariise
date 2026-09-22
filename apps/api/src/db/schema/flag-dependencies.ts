import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { project } from "./project.js";

// `requires` is evaluated before `referencedIn`, so the dependencies screen can
// show an evaluation order rather than a cycle.
export const flagDependency = pgTable(
  "flag_dependencies",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    requires: text("requires").notNull(),
    referencedIn: text("referenced_in"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("flag_dependency_project_key_requires_idx").on(
      table.projectId,
      table.key,
      table.requires,
    ),
    index("flag_dependency_project_id_idx").on(table.projectId),
  ],
);
