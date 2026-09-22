import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { segment } from "./segments.js";

export const segmentCondition = pgTable(
  "segment_conditions",
  {
    id: text("id").primaryKey(),
    segmentId: text("segment_id")
      .notNull()
      .references(() => segment.id, { onDelete: "cascade" }),
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
  (table) => [index("segment_condition_segment_id_idx").on(table.segmentId)],
);
