import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { environment } from "./environments.js";
import { project } from "./project.js";

/**
 * A flag belongs to one environment, and its configuration belongs to the flag.
 *
 * This is why there is no `flag_environment_configs` table: a flag that exists
 * in exactly one environment has exactly one configuration, and a separate row
 * for it could only ever be missing, duplicated or out of step. The key is
 * unique per environment, so the same key may name different flags in different
 * environments — that is what promotion copies.
 */
export const flag = pgTable(
  "flags",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    environmentId: text("environment_id")
      .notNull()
      .references(() => environment.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    type: text("type").notNull().default("boolean"),
    tags: text("tags").array().notNull().default([]),
    owner: text("owner"),
    status: text("status").notNull().default("active"),
    enabled: boolean("enabled").notNull().default(false),
    offVariationKey: text("off_variation_key").notNull().default("off"),
    defaultVariationKey: text("default_variation_key").notNull().default("on"),
    rolloutPercentage: integer("rollout_percentage").notNull().default(0),
    bucketBy: text("bucket_by").notNull().default("userId"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("flag_environment_key_idx").on(
      table.environmentId,
      table.key,
    ),
    index("flag_project_id_idx").on(table.projectId),
    index("flag_status_idx").on(table.status),
  ],
);
