"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * The "more actions" menu for an environment.
 *
 * A Client Component because Radix needs to own the trigger's ref, which a
 * Server Component cannot hand over. Every item is disabled with a title rather
 * than pretending to work — nothing here is wired to the API yet.
 */
export function EnvironmentMenu({ name }: { name: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`More actions for ${name}`}
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{name}</DropdownMenuLabel>
        <DropdownMenuItem disabled title="Duplicate — coming soon">
          Duplicate environment
        </DropdownMenuItem>
        <DropdownMenuItem disabled title="Rotate keys — coming soon">
          Rotate keys
        </DropdownMenuItem>
        <DropdownMenuItem disabled title="Delete — coming soon">
          Delete environment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
