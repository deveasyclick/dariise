import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { targetingRule } from "./targeting-rules.js";

export const targetingCondition = pgTable(
  "targeting_conditions",
  {
    id: text("id").primaryKey(),
    ruleId: text("rule_id")
      .notNull()
      .references(() => targetingRule.id, { onDelete: "cascade" }),
    attribute: text("attribute").notNull(),
    attributeType: text("attribute_type").notNull().default("string"),
    operator: text("operator").notNull(),
    values: jsonb("values").notNull().default([]),
    priority: integer("priority").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("targeting_condition_rule_id_idx").on(table.ruleId),
  ],
);
