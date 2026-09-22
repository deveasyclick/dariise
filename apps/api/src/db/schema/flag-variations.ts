import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { environment } from "./environments.js";
import { flag } from "./flags.js";

// Variations are per environment: the same flag can offer different values in
// development and production.
export const flagVariation = pgTable(
  "flag_variations",
  {
    id: text("id").primaryKey(),
    flagId: text("flag_id")
      .notNull()
      .references(() => flag.id, { onDelete: "cascade" }),
    environmentId: text("environment_id")
      .notNull()
      .references(() => environment.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    name: text("name").notNull(),
    value: jsonb("value").notNull(),
    description: text("description"),
    priority: integer("priority").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("flag_variation_flag_env_key_idx").on(
      table.flagId,
      table.environmentId,
      table.key,
    ),
  ],
);
