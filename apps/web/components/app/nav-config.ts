import {
  ChartColumnIcon,
  Code2Icon,
  FlagIcon,
  HistoryIcon,
  HouseIcon,
  KeyRoundIcon,
  LayersIcon,
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
 * render as deliberately non-interactive, with their state announced to
 * assistive technology ("Coming soon") and a title on hover — nothing in the
 * sidebar leads to a route that does not exist.
 *
 * Environments are reached through the environment switcher in the sidebar
 * header rather than a nav entry of their own, which is what the design shows.
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
    label: "Overview",
    items: [{ label: "Overview", icon: HouseIcon, href: "/overview" }],
  },
  {
    label: "Configuration",
    items: [
      { label: "Feature Flags", icon: FlagIcon, href: "/flags" },
      { label: "Segments", icon: LayersIcon, href: "/segments" },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "API Keys", icon: KeyRoundIcon, href: "/api-keys" },
      { label: "Webhooks", icon: WebhookIcon },
      { label: "Audit Log", icon: HistoryIcon, href: "/audit-log" },
      { label: "Team", icon: UsersIcon },
    ],
  },
  {
    label: "Developer",
    items: [{ label: "SDKs", icon: Code2Icon }],
  },
  {
    label: "Insights",
    items: [{ label: "Analytics", icon: ChartColumnIcon, href: "/analytics" }],
  },
  {
    label: "Settings",
    items: [{ label: "Settings", icon: SettingsIcon, href: "/settings" }],
  },
];
