import type { ProjectSummary } from "@dariise/contracts";

export type ProjectRow = ProjectSummary;

export interface NewProject {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  environmentName: string;
}
