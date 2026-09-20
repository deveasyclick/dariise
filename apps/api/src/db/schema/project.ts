import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organization } from "./organization.js";

export const project = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    /** Tenant key. Every project query is scoped by this. */
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    /**
     * Slug used in API paths, e.g. `checkout-platform`.
     *
     * Unique **per workspace**, not globally: two tenants may both have a
     * project called `web-app`. See ADR-0003.
     */
    key: text("key").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    // The one environment onboarding creates. Deliberately a plain column, not an
    // FK, until the environments table lands.
    environmentName: text("environment_name").notNull().default("Development"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("project_organization_key_idx").on(
      table.organizationId,
      table.key,
    ),
    index("project_organization_id_idx").on(table.organizationId),
  ],
);
