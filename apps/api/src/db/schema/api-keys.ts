import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { environment } from "./environments.js";
import { project } from "./project.js";

// Only the hash of the secret is stored; `prefix` and `suffix` are the two
// non-secret ends the dashboard lists as `ff_a1b2*****3d4e`. A null
// `environmentId` means the key works everywhere.
export const apiKey = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    environmentId: text("environment_id").references(() => environment.id, {
      onDelete: "set null",
    }),
    kind: text("kind").notNull().default("management"),
    name: text("name").notNull(),
    prefix: text("prefix").notNull(),
    suffix: text("suffix").notNull(),
    secretHash: text("secret_hash").notNull(),
    scopes: text("scopes").array().notNull().default([]),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("api_key_prefix_idx").on(table.prefix),
    index("api_key_project_id_idx").on(table.projectId),
  ],
);
