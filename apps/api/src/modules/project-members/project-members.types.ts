export interface ProjectMemberRow {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  createdAt: Date;
  name: string;
  email: string;
}

export interface ProjectMemberActorContext {
  organizationId: string;
  workspaceRole: string;
  userId: string;
}

export interface NewProjectMemberRecord {
  id: string;
  projectId: string;
  userId: string;
  role: string;
}
