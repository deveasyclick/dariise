import type { Project } from "@dariise/contracts";

import type { ProjectDetailRow } from "./projects.types.js";

export function toProject(row: ProjectDetailRow): Project {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    color: row.color,
    ownerTeam: row.ownerTeam,
    environmentName: row.environmentName,
    defaultEnvironmentId: row.defaultEnvironmentId,
    environmentCount: row.environmentCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
