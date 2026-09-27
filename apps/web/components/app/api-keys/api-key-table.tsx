"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircleIcon, MoreHorizontalIcon } from "lucide-react";
import { cn } from "cn";
import {
  EnvironmentPill,
  KeyGlyph,
} from "@/components/app/api-keys/api-key-badges";
import type { ApiKeyView } from "@/components/app/api-keys/api-key-view";
import { RenameApiKeyDialog } from "@/components/app/api-keys/rename-api-key-dialog";
import { RotateApiKeyDialog } from "@/components/app/api-keys/rotate-api-key-dialog";
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

/** The row's actions. Rename and rotate are real writes, not placeholders. */
function RowMenu({
  apiKey,
  pending,
  onRename,
  onRotate,
  onRevoke,
}: {
  readonly apiKey: ApiKeyView;
  readonly pending: boolean;
  readonly onRename: () => void;
  readonly onRotate: () => void;
  readonly onRevoke: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`More actions for ${apiKey.name}`}
          disabled={pending}
          className="cursor-pointer"
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
        <DropdownMenuItem onSelect={onRename}>Rename key</DropdownMenuItem>
        <DropdownMenuItem onSelect={onRotate}>Rotate key</DropdownMenuItem>
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
 * A Client Component because each row has an actions menu and every action is a
 * mutation. The key a dialog has just issued is shown in that dialog and nowhere
 * else: a secret that stays on the screen behind it is a secret left lying
 * around.
 */
export function ApiKeyTable({
  projectKey,
  keys,
  truncated,
}: {
  readonly projectKey: string;
  readonly keys: ApiKeyView[];
  readonly truncated: boolean;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<ApiKeyView | null>(null);
  const [rotateTarget, setRotateTarget] = useState<ApiKeyView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

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
      <section className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={headerClass}>Name</TableHead>
              <TableHead className={headerClass}>Key</TableHead>
              <TableHead className={headerClass}>Environment</TableHead>
              <TableHead className={headerClass}>Created</TableHead>
              <TableHead className={headerClass}>Last used</TableHead>
              <TableHead className={cn(headerClass, "w-10 text-right")}>
                {" "}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {keys.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-10 text-center text-[12px]"
                >
                  No API keys yet.
                </TableCell>
              </TableRow>
            ) : (
              keys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className={cellClass}>
                    <div className="flex items-center gap-2.5">
                      <KeyGlyph color={apiKey.environmentColor} />
                      <span className="truncate text-[12px] font-medium">
                        {apiKey.name}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className={cellClass}>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {apiKey.maskedKey}
                    </span>
                  </TableCell>

                  <TableCell className={cellClass}>
                    <EnvironmentPill
                      name={apiKey.environmentName}
                      color={apiKey.environmentColor}
                    />
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
                      onRename={() => {
                        setRenameTarget(apiKey);
                      }}
                      onRotate={() => {
                        setRotateTarget(apiKey);
                      }}
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

      <RenameApiKeyDialog
        projectKey={projectKey}
        apiKey={renameTarget}
        onClose={() => {
          setRenameTarget(null);
        }}
      />
      <RotateApiKeyDialog
        projectKey={projectKey}
        apiKey={rotateTarget}
        onClose={() => {
          setRotateTarget(null);
        }}
      />
    </div>
  );
}
