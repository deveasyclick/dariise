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
 * The "more actions" menu for a project.
 *
 * A Client Component because Radix needs to own the trigger's ref, which a
 * Server Component cannot hand over. Every item is disabled with a title rather
 * than pretending to work — nothing here is wired to the API yet.
 */
export function ProjectMenu({ name }: { name: string }) {
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
        <DropdownMenuItem disabled title="Rename — coming soon">
          Rename project
        </DropdownMenuItem>
        <DropdownMenuItem disabled title="Duplicate — coming soon">
          Duplicate project
        </DropdownMenuItem>
        <DropdownMenuItem disabled title="Transfer — coming soon">
          Transfer ownership
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
