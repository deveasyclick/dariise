import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./user.js";

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  // Deliberately plain text: becomes an FK with a cascading delete when the
  // projects table lands. Keeps `CreateProjectInput.setAsDefault` meaningful.
  defaultProjectId: text("default_project_id"),
  theme: text("theme").notNull().default("system"),
  defaultEnvironmentId: text("default_environment_id"),
  notifyOnFlagChange: boolean("notify_on_flag_change").notNull().default(true),
  notifyOnRolloutComplete: boolean("notify_on_rollout_complete")
    .notNull()
    .default(true),
  /** Weekly digest opt-in, shown on the profile screen. */
  notifyWeeklyDigest: boolean("notify_weekly_digest").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
