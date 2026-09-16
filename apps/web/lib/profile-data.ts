/**
 * TEMPORARY PROFILE MOCK DATA — not connected to anything.
 *
 * `apps/api` does not exist yet, so the Profile screen reads from the fixture
 * below, in the same spirit as `settings-data.ts` and `dashboard-data.ts`.
 * Nothing here is fetched or persisted. When the API lands, replace `getProfile`
 * with a call to `@/lib/api` and delete this module.
 *
 * The record is assembled rather than copied: identity comes from
 * `dashboard-data.ts` (the signed-in user the chrome already renders), the
 * workspace name and theme from `settings-data.ts`, and the default environment
 * from the environments fixture. Only what is genuinely personal — the
 * membership date and the notification choices — is stored here.
 *
 * The membership date is a fixed instant rather than an age offset: it is a fact
 * about the account, not a relative label, so it must not drift with `now`.
 */

import { getCurrentUser } from "@/lib/dashboard-data";
import { getEnvironmentOptions } from "@/lib/environment-data";
import { formatMonthYear } from "@/lib/format";
import {
  getWorkspaceProfile,
  type WorkspaceTheme,
} from "@/lib/settings-data";

/** When this account joined the workspace. */
const memberSince = "2024-01-15T12:00:00.000Z";

export interface ProfileNotifications {
  flagChanges: boolean;
  weeklyDigest: boolean;
  incidentAlerts: boolean;
}

/** One switch on the Notifications card. */
export interface NotificationRow {
  key: keyof ProfileNotifications;
  label: string;
  description: string;
}

export const notificationRows: NotificationRow[] = [
  {
    key: "flagChanges",
    label: "Flag changes",
    description: "Email me when a flag I own is updated.",
  },
  {
    key: "weeklyDigest",
    label: "Weekly digest",
    description: "Summary of rollout activity every Monday.",
  },
  {
    key: "incidentAlerts",
    label: "Incident alerts",
    description: "Real-time alerts for evaluation errors.",
  },
];

/** The personal preferences the Profile screen can change. */
export interface ProfilePreferences {
  theme: WorkspaceTheme;
  defaultEnvironmentKey: string;
}

export interface ProfileRecord {
  name: string;
  email: string;
  initials: string;
  role: string;
  /** e.g. `Jan 2024`. */
  memberSinceLabel: string;
  workspaceName: string;
  preferences: ProfilePreferences;
  notifications: ProfileNotifications;
}

const notifications: ProfileNotifications = {
  flagChanges: true,
  weeklyDigest: true,
  incidentAlerts: false,
};

/** The account as the Profile screen renders it. */
export function getProfile(): ProfileRecord {
  const user = getCurrentUser();
  const workspace = getWorkspaceProfile();
  const defaultEnvironment =
    getEnvironmentOptions().find(
      (environment) => environment.key === workspace.defaultEnvironmentKey,
    )?.key ?? "";

  return {
    name: user.name,
    email: user.email,
    initials: user.initials,
    role: user.role,
    memberSinceLabel: formatMonthYear(memberSince),
    workspaceName: workspace.name,
    preferences: {
      theme: workspace.theme,
      defaultEnvironmentKey: defaultEnvironment,
    },
    notifications,
  };
}
