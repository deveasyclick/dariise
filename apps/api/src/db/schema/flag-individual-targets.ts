import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { environment } from "./environments.js";
import { flag } from "./flags.js";

// Explicit per-user overrides, resolved before any targeting rule.
export const flagIndividualTarget = pgTable(
  "flag_individual_targets",
  {
    id: text("id").primaryKey(),
    flagId: text("flag_id")
      .notNull()
      .references(() => flag.id, { onDelete: "cascade" }),
    environmentId: text("environment_id")
      .notNull()
      .references(() => environment.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    variationKey: text("variation_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("flag_individual_target_flag_env_user_idx").on(
      table.flagId,
      table.environmentId,
      table.userId,
    ),
    index("flag_individual_target_flag_env_idx").on(
      table.flagId,
      table.environmentId,
    ),
  ],
);
