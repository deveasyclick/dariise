/**
 * TEMPORARY PROJECT MOCK DATA — not connected to anything.
 *
 * `apps/api` does not exist yet, so the chrome's project switcher and the
 * project screens read from the fixtures below, in the same spirit as
 * `environment-data.ts` and `dashboard-data.ts`. Nothing here is fetched or
 * persisted, and switching projects is not wired up: the switcher marks the
 * current project and links to the screens.
 *
 * Two things are deliberately shared rather than duplicated:
 * - the owner is `getCurrentUser()`, so the summary card cannot disagree with
 *   the account menu about who is signed in;
 * - flag keys must exist in `dashboard-data.ts`, because the project screens
 *   link each flag to its detail route and an unknown key would 404.
 *
 * Environment counts are project-scoped: "76 flags on" in Production here means
 * this project enables 76 flags there, not that the workspace has 76 flags.
 * "Last changed" is stored as a fixed age rather than a date and resolved
 * against a `now` the caller passes in, so relative labels stay stable between
 * the server render and client hydration.
 *
 * When the API lands, replace the getters with calls to `@/lib/api` and delete
 * this module.
 */

import { getCurrentUser } from "@/lib/dashboard-data";
import type { EnvironmentColor } from "@/lib/environment-data";
import { formatRelativeTime, hoursAgo } from "@/lib/format";

/** Glyph a project is drawn with; maps to a lucide icon in the components. */
export type ProjectGlyph = "folder" | "flask" | "phone" | "wrench";

export type ProjectStatus = "healthy" | "degraded";

/** One environment as the project screens summarise it. */
export interface ProjectEnvironment {
  /** Environment key, matching `environment-data.ts`. */
  key: string;
  name: string;
  color: EnvironmentColor;
  /** Flags this project enables in the environment. */
  flagsOn: number;
  isDefault: boolean;
}

/** One flag as it appears in a project's flag list. */
export interface ProjectFlag {
  /** Flag key; must exist in `dashboard-data.ts` so the row can link to it. */
  key: string;
  /** Environment the state below applies to; must be one of the project's. */
  environmentKey: string;
  /** Whole percentage of traffic served; 100 means enabled everywhere. */
  rollout: number;
}

export interface ProjectMember {
  name: string;
  email: string;
  initials: string;
  role: string;
}

export interface ProjectRecord {
  /** Unique key, e.g. `checkout-platform`. Maps to `Project.key`. */
  key: string;
  name: string;
  glyph: ProjectGlyph;
  /** Colour chosen on the create screen; tints the project's icon tile. */
  color: EnvironmentColor;
  description: string;
  /** Team that owns the project, e.g. `Payments`. */
  ownerTeam: string;
  status: ProjectStatus;
  /** The project a signed-in user lands in. Exactly one is marked. */
  isDefault: boolean;
  segments: number;
  sdkKeys: number;
  /** Age of the last change, in minutes, resolved against `now`. */
  updatedMinutesAgo: number;
  environments: ProjectEnvironment[];
  flags: ProjectFlag[];
}

/** A project as the switcher needs it — the record, flattened. */
export interface Project {
  key: string;
  name: string;
  glyph: ProjectGlyph;
  environmentCount: number;
  isDefault: boolean;
}

/** Environments a new project is created with. */
export interface EnvironmentPreset {
  value: string;
  /** What the select shows before the environments it creates. */
  label: string;
  environments: string[];
}

/**
 * Presets offered on the create screen.
 *
 * One preset for now, matching the design; the field exists because the API
 * will take a preset rather than a list of environment names.
 */
export const environmentPresets: EnvironmentPreset[] = [
  {
    value: "standard",
    label: "Standard",
    environments: ["Development", "Staging", "Production"],
  },
];

const records: ProjectRecord[] = [
  {
    key: "checkout-platform",
    name: "Checkout Platform",
    glyph: "folder",
    color: "primary",
    description:
      "Pricing, checkout and billing surfaces. Owned by the Payments team.",
    ownerTeam: "Payments",
    status: "healthy",
    isDefault: true,
    segments: 5,
    sdkKeys: 12,
    updatedMinutesAgo: 2,
    environments: [
      { key: "development", name: "Development", color: "cyan", flagsOn: 40, isDefault: false },
      { key: "staging", name: "Staging", color: "purple", flagsOn: 32, isDefault: false },
      { key: "production", name: "Production", color: "primary", flagsOn: 76, isDefault: true },
    ],
    flags: [
      { key: "checkout-v2", environmentKey: "production", rollout: 100 },
      { key: "dark-mode", environmentKey: "production", rollout: 100 },
      { key: "new-dashboard", environmentKey: "production", rollout: 50 },
      { key: "beta-onboarding", environmentKey: "staging", rollout: 100 },
    ],
  },
  {
    key: "growth-experiments",
    name: "Growth Experiments",
    glyph: "flask",
    color: "purple",
    description:
      "Landing pages, onboarding and lifecycle experiments. Owned by Growth.",
    ownerTeam: "Growth",
    status: "healthy",
    isDefault: false,
    segments: 3,
    sdkKeys: 6,
    updatedMinutesAgo: 60,
    environments: [
      { key: "development", name: "Development", color: "cyan", flagsOn: 44, isDefault: false },
      { key: "staging", name: "Staging", color: "purple", flagsOn: 42, isDefault: true },
    ],
    flags: [
      { key: "beta-onboarding", environmentKey: "staging", rollout: 100 },
      { key: "search-ranking", environmentKey: "staging", rollout: 50 },
      { key: "ai-summaries", environmentKey: "development", rollout: 25 },
    ],
  },
  {
    key: "mobile-app",
    name: "Mobile App",
    glyph: "phone",
    color: "indigo",
    description:
      "iOS and Android release gating with staged rollouts. Owned by Mobile.",
    ownerTeam: "Mobile",
    status: "healthy",
    isDefault: false,
    segments: 4,
    sdkKeys: 9,
    updatedMinutesAgo: 180,
    environments: [
      { key: "development", name: "Development", color: "cyan", flagsOn: 20, isDefault: false },
      { key: "staging", name: "Staging", color: "purple", flagsOn: 18, isDefault: false },
      { key: "production", name: "Production", color: "primary", flagsOn: 26, isDefault: true },
    ],
    flags: [
      { key: "dark-mode", environmentKey: "production", rollout: 100 },
      { key: "checkout-v3", environmentKey: "staging", rollout: 0 },
      { key: "ai-summaries", environmentKey: "production", rollout: 15 },
    ],
  },
  {
    key: "internal-tools",
    name: "Internal Tools",
    glyph: "wrench",
    color: "slate",
    description:
      "Admin surfaces, support tooling, and internal automation. Owned by Platform.",
    ownerTeam: "Platform",
    status: "healthy",
    isDefault: false,
    segments: 2,
    sdkKeys: 4,
    updatedMinutesAgo: 8_640,
    environments: [
      { key: "development", name: "Development", color: "cyan", flagsOn: 9, isDefault: false },
      { key: "production", name: "Production", color: "primary", flagsOn: 12, isDefault: true },
    ],
    flags: [
      { key: "sso-saml", environmentKey: "production", rollout: 100 },
      { key: "flag-archiver", environmentKey: "development", rollout: 30 },
      { key: "search-ranking", environmentKey: "production", rollout: 100 },
    ],
  },
];

/** Collaborators shown on every project until the API can return real teams. */
const collaborators: ProjectMember[] = [
  {
    name: "Sarah Chen",
    email: "sarah@acme.io",
    initials: "SC",
    role: "Admin",
  },
  {
    name: "Mariam Okonkwo",
    email: "mariam@acme.io",
    initials: "MO",
    role: "Engineer",
  },
];

/** Every project record, in switcher order. */
export function getProjectRecords(): ProjectRecord[] {
  return records;
}

/** Every project as the switcher needs it. */
export function getProjects(): Project[] {
  return records.map((record) => ({
    key: record.key,
    name: record.name,
    glyph: record.glyph,
    environmentCount: record.environments.length,
    isDefault: record.isDefault,
  }));
}

/** The project the chrome is scoped to, i.e. the default one. */
export function getCurrentProject(): Project {
  const projects = getProjects();

  return projects.find((project) => project.isDefault) ?? projects[0];
}

/** Look up one project by key; `null` when it does not exist. */
export function getProject(key: string): ProjectRecord | null {
  return records.find((record) => record.key === key) ?? null;
}

/** Every key, for the create screen's duplicate check and the detail lookup. */
export function getProjectKeys(): string[] {
  return records.map((record) => record.key);
}

/** Flags this project enables, across all of its environments. */
export function getProjectFlagCount(record: ProjectRecord): number {
  return record.environments.reduce(
    (total, environment) => total + environment.flagsOn,
    0,
  );
}

/**
 * How long ago the project last changed, e.g. `2m ago`.
 *
 * @param now - The moment the label is measured against. Callers pass a single
 * value for the whole render so server and client agree.
 */
export function getProjectUpdatedLabel(
  record: ProjectRecord,
  now: Date,
): string {
  return formatRelativeTime(
    hoursAgo(record.updatedMinutesAgo / 60, now),
    now,
  );
}

/**
 * The project's team, owner first.
 *
 * The owner is derived from the signed-in user so the two cannot drift, and the
 * same collaborators are shown for every project — there is no membership model
 * yet.
 */
export function getProjectMembers(): ProjectMember[] {
  const user = getCurrentUser();

  return [
    {
      name: user.name,
      email: user.email,
      initials: user.initials,
      role: user.role,
    },
    ...collaborators,
  ];
}
