/**
 * TEMPORARY WORKSPACE SETTINGS MOCK DATA — not connected to anything.
 *
 * `apps/api` does not exist yet, so the Settings screens read from the fixtures
 * below, in the same spirit as `environment-data.ts` and `dashboard-data.ts`.
 * Nothing here is fetched or persisted. When the API lands, replace the getters
 * with calls to `@/lib/api` and delete this module.
 *
 * The workspace name is owned here rather than in the chrome: `app/(app)/layout`
 * reads `getWorkspaceProfile()` and passes the name to the sidebar and topbar, so
 * the General tab and the chip in the corner cannot disagree about it.
 *
 * The workspace slug is immutable once the workspace exists — the same rule the
 * create-environment screen applies to environment keys — so the URL is a
 * read-only projection of the slug rather than a second stored value.
 */

export type WorkspaceTheme = "light" | "dark" | "system";

export interface WorkspaceProfile {
  name: string;
  /** Immutable identifier used in the workspace URL. */
  slug: string;
  defaultEnvironmentKey: string;
  timezone: string;
  theme: WorkspaceTheme;
}

export type SessionTimeout = "1h" | "12h" | "24h" | "7d";

export interface SecuritySettings {
  /** Identity provider connected for SAML single sign-on. */
  ssoProvider: string;
  ssoConnected: boolean;
  twoFactorEnabled: boolean;
  sessionTimeout: SessionTimeout;
  /** Domains that may be invited to the workspace. */
  allowedEmailDomains: string[];
  /** Whether an IP allowlist has been configured. None has. */
  ipAllowlistConfigured: boolean;
  auditRetentionDays: number;
}

/** How an integration's tile is drawn; see `components/app/settings/`. */
export type IntegrationGlyph =
  | "slack"
  | "github"
  | "datadog"
  | "pagerduty"
  | "jira"
  | "segment";

export type IntegrationTone = "primary" | "purple" | "green" | "info" | "slate";

export interface IntegrationApp {
  key: string;
  name: string;
  description: string;
  connected: boolean;
  glyph: IntegrationGlyph;
  tone: IntegrationTone;
}

/** Host the workspace lives under, e.g. `dariise.dev/acme-inc`. */
export const workspaceHost = "dariise.dev";

/** What the settings shell calls every tab. */
export const settingsDescription =
  "Manage your workspace, team access, and developer configuration.";

export const themeOptions: Array<{
  value: WorkspaceTheme;
  label: string;
}> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export const timezoneOptions = [
  "(GMT+0) London",
  "(GMT+1) Lagos",
  "(GMT+1) Berlin",
  "(GMT+2) Johannesburg",
  "(GMT-5) New York",
  "(GMT-8) Los Angeles",
] as const;

export const sessionTimeoutOptions: Array<{
  value: SessionTimeout;
  label: string;
}> = [
  { value: "1h", label: "1 hour" },
  { value: "12h", label: "12 hours" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
];

export const auditRetentionOptions: Array<{
  value: number;
  label: string;
}> = [
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 365, label: "1 year" },
];

const workspaceProfile: WorkspaceProfile = {
  name: "Acme Inc",
  slug: "acme-inc",
  defaultEnvironmentKey: "production",
  timezone: "(GMT+1) Lagos",
  theme: "light",
};

const securitySettings: SecuritySettings = {
  ssoProvider: "Okta",
  ssoConnected: true,
  twoFactorEnabled: true,
  sessionTimeout: "12h",
  allowedEmailDomains: ["acme.io"],
  ipAllowlistConfigured: false,
  auditRetentionDays: 90,
};

const integrations: IntegrationApp[] = [
  {
    key: "slack",
    name: "Slack",
    description: "Flag changes in your channels.",
    connected: true,
    glyph: "slack",
    tone: "purple",
  },
  {
    key: "github",
    name: "GitHub",
    description: "Link flags to pull requests.",
    connected: true,
    glyph: "github",
    tone: "slate",
  },
  {
    key: "datadog",
    name: "Datadog",
    description: "Forward evaluation metrics.",
    connected: false,
    glyph: "datadog",
    tone: "purple",
  },
  {
    key: "pagerduty",
    name: "PagerDuty",
    description: "Page on rollout incidents.",
    connected: false,
    glyph: "pagerduty",
    tone: "green",
  },
  {
    key: "jira",
    name: "Jira",
    description: "Sync rollout tasks.",
    connected: false,
    glyph: "jira",
    tone: "info",
  },
  {
    key: "segment",
    name: "Segment",
    description: "Stream flag exposures.",
    connected: false,
    glyph: "segment",
    tone: "primary",
  },
];

/** The workspace as the General tab and the chrome render it. */
export function getWorkspaceProfile(): WorkspaceProfile {
  return workspaceProfile;
}

/** The readable URL for the workspace, e.g. `dariise.dev/acme-inc`. */
export function getWorkspaceUrl(): string {
  return `${workspaceHost}/${workspaceProfile.slug}`;
}

/** Sign-in, session and access-control settings. */
export function getSecuritySettings(): SecuritySettings {
  return securitySettings;
}

/** The app directory shown on the Integrations tab. */
export function getIntegrations(): IntegrationApp[] {
  return integrations;
}
