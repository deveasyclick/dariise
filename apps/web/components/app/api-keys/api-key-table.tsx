"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircleIcon, MoreHorizontalIcon } from "lucide-react";
import { cn } from "cn";
import { ApiKeyCreatedNotice } from "@/components/app/api-keys/api-key-created-notice";
import {
  EnvironmentPill,
  KeyGlyph,
  NewBadge,
  ScopePills,
} from "@/components/app/api-keys/api-key-badges";
import { useCreatedApiKey } from "@/components/app/api-keys/api-keys-provider";
import {
  toApiKeyView,
  type ApiKeyView,
  type EnvironmentOption,
} from "@/components/app/api-keys/api-key-view";
import { writeToClipboard } from "@/components/app/copy-button";
import { FieldError } from "@/components/auth/field";
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
import { ApiError, apiKeys } from "@/lib/api";

const headerClass =
  "text-muted-foreground h-8 px-3 text-[10px] font-medium tracking-[0.1em] uppercase";
const cellClass = "px-3 py-2.5 text-[12px]";

function RowMenu({
  apiKey,
  pending,
  onRevoke,
}: {
  apiKey: ApiKeyView;
  pending: boolean;
  onRevoke: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`More actions for ${apiKey.name}`}
          disabled={pending}
        >
          {pending ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <MoreHorizontalIcon aria-hidden="true" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{apiKey.name}</DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={() => {
            void writeToClipboard(apiKey.prefix);
          }}
        >
          Copy prefix
        </DropdownMenuItem>
        <DropdownMenuItem disabled title="Rename — coming soon">
          Rename key
        </DropdownMenuItem>
        <DropdownMenuItem disabled title="Rotate — coming soon">
          Rotate key
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onRevoke}>
          Revoke key
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The API key list.
 *
 * A Client Component because each row has an actions menu and revoking is a
 * mutation. The key issued on the create screen is read from the provider that
 * wraps both routes, and merged in with its secret still attached.
 */
export function ApiKeyTable({
  projectKey,
  keys,
  environments,
  now,
  truncated,
}: {
  projectKey: string;
  keys: ApiKeyView[];
  environments: EnvironmentOption[];
  now: string;
  truncated: boolean;
}) {
  const router = useRouter();
  const { created, setCreated } = useCreatedApiKey();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const createdRow = created
    ? toApiKeyView(created, environments, new Date(now), true)
    : null;
  const rows = createdRow
    ? [createdRow, ...keys.filter((key) => key.id !== createdRow.id)]
    : keys;

  async function handleRevoke(apiKey: ApiKeyView) {
    if (pendingId) return;

    setPendingId(apiKey.id);
    setError(null);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await apiKeys.revoke(projectKey, apiKey.id, {
        signal: controller.signal,
      });
      if (created?.id === apiKey.id) setCreated(null);
      router.refresh();
    } catch (cause) {
      if ((cause as Error)?.name === "AbortError") return;

      setError(
        cause instanceof ApiError
          ? cause.message
          : "The key could not be revoked. Please try again.",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {createdRow && created ? (
        <ApiKeyCreatedNotice name={created.name} secret={created.secret} />
      ) : null}

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
                          {apiKey.prefix}
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
                    <RowMenu
                      apiKey={apiKey}
                      pending={pendingId === apiKey.id}
                      onRevoke={() => {
                        void handleRevoke(apiKey);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {truncated ? (
          <p className="text-muted-foreground border-t px-4 py-2.5 text-[11px]">
            Showing the first {keys.length} keys.
          </p>
        ) : null}
      </section>

      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}
