import {
  ActivityIcon,
  Code2Icon,
  FlagIcon,
  KeyRoundIcon,
  LayersIcon,
  LayoutDashboardIcon,
  ScrollTextIcon,
  ServerIcon,
  SettingsIcon,
  UsersIcon,
  WebhookIcon,
  type LucideIcon,
} from "lucide-react";

/**
 * Sidebar navigation.
 *
 * Every section from the design is listed so the shell reads as a complete
 * product, but only entries with an `href` are real links. Entries without one
 * render as deliberately non-interactive, marked "Soon" — nothing in the
 * sidebar leads to a route that does not exist.
 */
export interface NavItem {
  label: string;
  icon: LucideIcon;
  /** Omit while the screen is unbuilt; see the module comment. */
  href?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    label: "Core",
    items: [
      { label: "Overview", icon: LayoutDashboardIcon, href: "/overview" },
      { label: "Feature Flags", icon: FlagIcon, href: "/flags" },
      { label: "Segments", icon: LayersIcon, href: "/segments" },
      { label: "Environments", icon: ServerIcon, href: "/environments" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Activity", icon: ActivityIcon },
      { label: "Audit Log", icon: ScrollTextIcon },
    ],
  },
  {
    label: "Developer",
    items: [
      { label: "API Keys", icon: KeyRoundIcon },
      { label: "SDKs", icon: Code2Icon },
      { label: "Webhooks", icon: WebhookIcon },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Settings", icon: SettingsIcon },
      { label: "Team", icon: UsersIcon },
    ],
  },
];
