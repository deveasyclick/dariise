import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { environment } from "./environments.js";
import { flag } from "./flags.js";

// Ordered per environment. Conditions are AND-ed; a referenced segment adds a
// membership condition to this rule.
export const targetingRule = pgTable(
  "targeting_rules",
  {
    id: text("id").primaryKey(),
    flagId: text("flag_id")
      .notNull()
      .references(() => flag.id, { onDelete: "cascade" }),
    environmentId: text("environment_id")
      .notNull()
      .references(() => environment.id, { onDelete: "cascade" }),
    priority: integer("priority").notNull().default(0),
    description: text("description"),
    variationKey: text("variation_key").notNull(),
    segmentKeys: text("segment_keys").array().notNull().default([]),
    rolloutPercentage: integer("rollout_percentage"),
    bucketBy: text("bucket_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("targeting_rule_flag_env_idx").on(table.flagId, table.environmentId),
  ],
);
