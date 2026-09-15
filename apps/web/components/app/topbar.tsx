import { BellIcon, ChevronDownIcon, MoonIcon, SearchIcon } from "lucide-react";
import { MobileNav } from "@/components/app/app-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import type { CurrentUser } from "@/lib/dashboard-data";

interface TopbarProps {
  user: CurrentUser;
  environmentLabel: string;
}

/**
 * Application topbar. Kept a Server Component: the only interactive parts are
 * the mobile drawer and the avatar, which are imported client components.
 *
 * Search, the environment switcher and notifications are presentational for now
 * and are marked as such rather than pretending to work.
 */
export function Topbar({ user, environmentLabel }: TopbarProps) {
  return (
    <header className="bg-card flex h-12 shrink-0 items-center gap-3 border-b px-3">
      <MobileNav />

      <div className="relative w-full max-w-xs">
        <SearchIcon
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
        />
        <Input
          type="search"
          disabled
          aria-label="Search flags, segments and keys"
          placeholder="Search flags, segments, keys…"
          className="h-8 pl-8 text-[13px]"
        />
        <kbd className="border-border text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border px-1.5 py-px text-[10px]">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span
          title="Project switcher — coming soon"
          className="bg-muted text-muted-foreground hidden items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] sm:flex"
        >
          <span className="text-foreground font-medium">Acme Inc.</span>
          <span className="opacity-60">·</span>
          {environmentLabel}
          <ChevronDownIcon aria-hidden="true" className="size-3.5" />
        </span>

        <span
          title="Theme toggle — coming soon"
          aria-hidden="true"
          className="text-muted-foreground hidden size-8 items-center justify-center sm:inline-flex"
        >
          <MoonIcon className="size-4" />
        </span>

        <span
          title="Notifications — coming soon"
          className="text-muted-foreground hidden size-8 items-center justify-center sm:inline-flex"
        >
          <BellIcon aria-hidden="true" className="size-4" />
        </span>

        <Avatar size="sm" title={`${user.name} — ${user.role}`}>
          <AvatarFallback className="bg-nav-active text-[10px] text-white">
            {user.initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
