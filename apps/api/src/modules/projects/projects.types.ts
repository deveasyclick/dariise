import type { ProjectSummary } from "@dariise/contracts";

export type ProjectRow = ProjectSummary;

export interface NewProject {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  environmentName: string;
}

/** The list/detail shape: the project plus how many environments it has. */
export interface ProjectDetailRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  color: string | null;
  ownerTeam: string | null;
  environmentName: string;
  defaultEnvironmentId: string | null;
  environmentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProjectRecord {
  name?: string;
  description?: string | null;
  color?: string | null;
  ownerTeam?: string | null;
  defaultEnvironmentId?: string | null;
}

export interface ProjectsActorContext {
  organizationId: string;
  workspaceRole: string;
  userId: string;
}

export interface EnvironmentRef {
  id: string;
  key: string;
}
