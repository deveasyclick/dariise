import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { flag } from "./flags.js";

// The values the flag can serve, shared by every environment. An environment
// selects among them with its config's off/default variation keys.
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
