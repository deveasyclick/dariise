import {
  ArchiveIcon,
  FolderPlusIcon,
  KeyRoundIcon,
  PercentIcon,
  PlusIcon,
  ServerIcon,
  SlidersHorizontalIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";
import type { AuditAction } from "@/lib/types";

/**
 * Icon and tint per audit action.
 *
 * The map is exhaustive over `AuditAction`, so adding an action to the domain
 * type is a type error here rather than a blank row on the timeline.
 */
export const auditActionMeta: Record<
  AuditAction,
  { icon: LucideIcon; tone: string }
> = {
  "project.created": {
    icon: FolderPlusIcon,
    tone: "bg-primary-ink/10 text-primary-ink",
  },
  "environment.created": {
    icon: ServerIcon,
    tone: "bg-primary-ink/10 text-primary-ink",
  },
  "flag.created": { icon: PlusIcon, tone: "bg-primary-ink/10 text-primary-ink" },
  "flag.updated": {
    icon: SlidersHorizontalIcon,
    tone: "bg-purple-ink/10 text-purple-ink",
  },
  "flag.enabled": {
    icon: ToggleRightIcon,
    tone: "bg-ok-ink/10 text-ok-ink",
  },
  "flag.disabled": {
    icon: ToggleLeftIcon,
    tone: "bg-muted text-slate-ink",
  },
  "flag.archived": {
    icon: ArchiveIcon,
    tone: "bg-danger-ink/10 text-danger-ink",
  },
  "rollout.updated": {
    icon: PercentIcon,
    tone: "bg-info-ink/10 text-info-ink",
  },
  "segment.created": {
    icon: UsersRoundIcon,
    tone: "bg-primary-ink/10 text-primary-ink",
  },
  "segment.updated": {
    icon: UsersRoundIcon,
    tone: "bg-purple-ink/10 text-purple-ink",
  },
  "api_key.created": { icon: KeyRoundIcon, tone: "bg-muted text-slate-ink" },
  "api_key.rotated": { icon: KeyRoundIcon, tone: "bg-muted text-slate-ink" },
  "api_key.revoked": {
    icon: KeyRoundIcon,
    tone: "bg-danger-ink/10 text-danger-ink",
  },
};
