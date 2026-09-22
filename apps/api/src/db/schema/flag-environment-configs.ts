import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { environment } from "./environments.js";
import { flag } from "./flags.js";

// The per-environment half of a flag: on/off, which variation is served, and
// the flag-level percentage rollout.
export const flagEnvironmentConfig = pgTable(
  "flag_environment_configs",
  {
    id: text("id").primaryKey(),
    flagId: text("flag_id")
      .notNull()
      .references(() => flag.id, { onDelete: "cascade" }),
    environmentId: text("environment_id")
      .notNull()
      .references(() => environment.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull().default(false),
    offVariationKey: text("off_variation_key").notNull().default("off"),
    defaultVariationKey: text("default_variation_key")
      .notNull()
      .default("on"),
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
    uniqueIndex("flag_environment_config_flag_env_idx").on(
      table.flagId,
      table.environmentId,
    ),
  ],
);
