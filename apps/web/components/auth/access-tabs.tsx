import Link from "next/link";
import { cn } from "cn";

const items = [
  { key: "access", label: "Access", href: "/sign-up" },
  { key: "workspace", label: "Workspace", href: "/create-workspace" },
] as const;

export type AccessTab = (typeof items)[number]["key"];

/**
 * Segmented control linking the two halves of onboarding.
 *
 * Rendered as links rather than tabs so each half stays a real, addressable
 * route that can be opened directly or bookmarked.
 */
export function AccessTabs({ current }: { current: AccessTab }) {
  return (
    <div className="bg-muted inline-flex items-center gap-1 rounded-lg p-1">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={current === item.key ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            current === item.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
