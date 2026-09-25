import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { flag } from "./flags.js";

// Variations belong to the flag, and a flag belongs to one environment, so
// these are that environment's values.
export const flagVariation = pgTable(
  "flag_variations",
  {
    id: text("id").primaryKey(),
    flagId: text("flag_id")
      .notNull()
      .references(() => flag.id, { onDelete: "cascade" }),
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
    uniqueIndex("flag_variation_flag_key_idx").on(table.flagId, table.key),
  ],
);
