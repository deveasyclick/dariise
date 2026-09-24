import {
  ArchiveIcon,
  FolderCogIcon,
  FolderPlusIcon,
  FolderXIcon,
  KeyRoundIcon,
  PercentIcon,
  PlusIcon,
  ServerCogIcon,
  ServerIcon,
  SlidersHorizontalIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  UserCogIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";
import type { AuditAction } from "@dariise/contracts";

export interface AuditActionMeta {
  icon: LucideIcon;
  tone: string;
  verb: string;
  targetLabel: string;
}

/**
 * Icon, tint and wording per audit action.
 *
 * The map is exhaustive over `AuditAction`, so adding an action to the wire
 * contract is a type error here rather than a blank row on the timeline.
 */
export const auditActionMeta: Record<AuditAction, AuditActionMeta> = {
  "project.created": {
    icon: FolderPlusIcon,
    tone: "bg-primary-ink/10 text-primary-ink",
    verb: "created project",
    targetLabel: "Project",
  },
  "project.updated": {
    icon: FolderCogIcon,
    tone: "bg-purple-ink/10 text-purple-ink",
    verb: "updated project",
    targetLabel: "Project",
  },
  "project.deleted": {
    icon: FolderXIcon,
    tone: "bg-danger-ink/10 text-danger-ink",
    verb: "deleted project",
    targetLabel: "Project",
  },
  "environment.created": {
    icon: ServerIcon,
    tone: "bg-primary-ink/10 text-primary-ink",
    verb: "created environment",
    targetLabel: "Environment",
  },
  "environment.updated": {
    icon: ServerCogIcon,
    tone: "bg-purple-ink/10 text-purple-ink",
    verb: "updated environment",
    targetLabel: "Environment",
  },
  "flag.created": {
    icon: PlusIcon,
    tone: "bg-primary-ink/10 text-primary-ink",
    verb: "created",
    targetLabel: "Flag",
  },
  "flag.updated": {
    icon: SlidersHorizontalIcon,
    tone: "bg-purple-ink/10 text-purple-ink",
    verb: "updated",
    targetLabel: "Flag",
  },
  "flag.enabled": {
    icon: ToggleRightIcon,
    tone: "bg-ok-ink/10 text-ok-ink",
    verb: "enabled",
    targetLabel: "Flag",
  },
  "flag.disabled": {
    icon: ToggleLeftIcon,
    tone: "bg-muted text-slate-ink",
    verb: "disabled",
    targetLabel: "Flag",
  },
  "flag.archived": {
    icon: ArchiveIcon,
    tone: "bg-danger-ink/10 text-danger-ink",
    verb: "archived",
    targetLabel: "Flag",
  },
  "rollout.updated": {
    icon: PercentIcon,
    tone: "bg-info-ink/10 text-info-ink",
    verb: "changed rollout on",
    targetLabel: "Flag",
  },
  "segment.created": {
    icon: UsersRoundIcon,
    tone: "bg-primary-ink/10 text-primary-ink",
    verb: "created segment",
    targetLabel: "Segment",
  },
  "segment.updated": {
    icon: UsersRoundIcon,
    tone: "bg-purple-ink/10 text-purple-ink",
    verb: "updated segment",
    targetLabel: "Segment",
  },
  "segment.archived": {
    icon: ArchiveIcon,
    tone: "bg-danger-ink/10 text-danger-ink",
    verb: "archived segment",
    targetLabel: "Segment",
  },
  "api_key.created": {
    icon: KeyRoundIcon,
    tone: "bg-muted text-slate-ink",
    verb: "created API key",
    targetLabel: "API key",
  },
  "api_key.rotated": {
    icon: KeyRoundIcon,
    tone: "bg-muted text-slate-ink",
    verb: "rotated API key",
    targetLabel: "API key",
  },
  "api_key.revoked": {
    icon: KeyRoundIcon,
    tone: "bg-danger-ink/10 text-danger-ink",
    verb: "revoked API key",
    targetLabel: "API key",
  },
  "project_member.added": {
    icon: UserPlusIcon,
    tone: "bg-primary-ink/10 text-primary-ink",
    verb: "added member",
    targetLabel: "Member",
  },
  "project_member.updated": {
    icon: UserCogIcon,
    tone: "bg-purple-ink/10 text-purple-ink",
    verb: "updated member",
    targetLabel: "Member",
  },
  "project_member.removed": {
    icon: UserMinusIcon,
    tone: "bg-danger-ink/10 text-danger-ink",
    verb: "removed member",
    targetLabel: "Member",
  },
};
