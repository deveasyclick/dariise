export interface AuditEntry {
  organizationId: string;
  actor: string;
  actorName?: string | null;
  action: string;
  target?: string | null;
  projectId?: string | null;
  environmentId?: string | null;
  changes?: unknown;
}
