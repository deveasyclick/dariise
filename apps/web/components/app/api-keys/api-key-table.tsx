"use client";

import { useSyncExternalStore } from "react";
import { MoreHorizontalIcon } from "lucide-react";
import { cn } from "cn";
import { ApiKeyCreatedNotice } from "@/components/app/api-keys/api-key-created-notice";
import {
  EnvironmentPill,
  KeyGlyph,
  NewBadge,
  ScopePills,
} from "@/components/app/api-keys/api-key-badges";
import { writeToClipboard } from "@/components/app/copy-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toApiKeyView, type ApiKeyView } from "@/lib/api-key-data";
import { getCreatedApiKey, subscribeToCreatedApiKey } from "@/lib/api-key-stub";
import type { EnvironmentOption } from "@/lib/environment-data";

const headerClass =
  "text-muted-foreground h-8 px-3 text-[10px] font-medium tracking-[0.1em] uppercase";
const cellClass = "px-3 py-2.5 text-[12px]";

/** Copy the credential and leave the row as it is. */
function RowMenu({ apiKey }: { apiKey: ApiKeyView }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`More actions for ${apiKey.name}`}
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{apiKey.name}</DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={() => {
            void writeToClipboard(apiKey.value);
          }}
        >
          Copy key
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Rename key</DropdownMenuItem>
        <DropdownMenuItem disabled>Rotate key</DropdownMenuItem>
        <DropdownMenuItem disabled>Revoke key</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The API key list.
 *
 * A Client Component for two reasons: each row has an actions menu, and the key
 * issued in this session has to be merged into the list. The second one is what
 * implements the design's "shown once" banner — the session store is read with
 * `useSyncExternalStore`, whose server snapshot is empty, so the banner appears
 * after the client-side return from the create form and disappears on reload.
 * Fixture rows arrive fully resolved, so nothing here formats a date.
 */
export function ApiKeyTable({
  keys,
  environments,
}: {
  keys: ApiKeyView[];
  environments: EnvironmentOption[];
}) {
  const created = useSyncExternalStore(
    subscribeToCreatedApiKey,
    getCreatedApiKey,
    () => null,
  );
  const createdRow = created ? toApiKeyView(created, environments) : null;
  const rows = createdRow ? [createdRow, ...keys] : keys;

  return (
    <div className="space-y-3">
      {createdRow ? <ApiKeyCreatedNotice apiKey={createdRow} /> : null}

      <section className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={headerClass}>Name</TableHead>
              <TableHead className={headerClass}>Environment</TableHead>
              <TableHead className={headerClass}>Scopes</TableHead>
              <TableHead className={headerClass}>Created</TableHead>
              <TableHead className={headerClass}>Last used</TableHead>
              <TableHead className={cn(headerClass, "w-10 text-right")}> </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-10 text-center text-[12px]"
                >
                  No API keys yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className={cellClass}>
                    <div className="flex items-center gap-2.5">
                      <KeyGlyph color={apiKey.environmentColor} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[12px] font-medium">
                            {apiKey.name}
                          </span>
                          {apiKey.isNew ? <NewBadge /> : null}
                        </div>
                        <span className="text-muted-foreground block truncate font-mono text-[11px]">
                          {apiKey.masked}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className={cellClass}>
                    <EnvironmentPill
                      name={apiKey.environmentName}
                      color={apiKey.environmentColor}
                    />
                  </TableCell>

                  <TableCell className={cellClass}>
                    <ScopePills scopes={apiKey.scopes} />
                  </TableCell>

                  <TableCell className={cn(cellClass, "text-muted-foreground")}>
                    {apiKey.createdLabel}
                  </TableCell>

                  <TableCell
                    className={cn(
                      cellClass,
                      apiKey.lastUsedLabel === "Never"
                        ? "text-danger-ink"
                        : "text-muted-foreground",
                    )}
                  >
                    {apiKey.lastUsedLabel}
                  </TableCell>

                  <TableCell className={cn(cellClass, "text-right")}>
                    <RowMenu apiKey={apiKey} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
