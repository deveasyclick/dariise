"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircleIcon, PencilIcon } from "lucide-react";
import type { ApiKeyView } from "@/components/app/api-keys/api-key-view";
import { Field } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError, apiKeys } from "@/lib/api";

/**
 * The name form for one key.
 *
 * Keyed by the row it edits, so reopening the menu on another key mounts a fresh
 * form instead of carrying the previous row's draft across.
 */
function RenameApiKeyForm({
  projectKey,
  apiKey,
  onClose,
}: {
  readonly projectKey: string;
  readonly apiKey: ApiKeyView;
  readonly onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(apiKey.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const trimmed = name.trim();

    if (!trimmed) {
      setError("Key name is required.");
      return;
    }

    setError(null);
    setPending(true);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await apiKeys.update(
        projectKey,
        apiKey.id,
        { name: trimmed },
        { signal: controller.signal },
      );
      onClose();
      router.refresh();
    } catch (caught) {
      if ((caught as Error)?.name === "AbortError") return;

      setError(
        caught instanceof ApiError
          ? caught.message
          : "The key could not be renamed. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field
        id="api-key-rename"
        label="Name"
        name="name"
        autoComplete="off"
        maxLength={80}
        value={name}
        error={error ?? undefined}
        onChange={(event) => {
          setName(event.target.value);
          setError(null);
        }}
      />

      {error ? null : (
        <p className="text-muted-foreground text-[11px]">
          Shown in the dashboard and audit log.
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>

        <Button type="submit" size="sm" className="gap-1.5" disabled={pending}>
          {pending ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <PencilIcon aria-hidden="true" className="size-3.5" />
          )}
          {pending ? "Saving…" : "Save name"}
        </Button>
      </div>
    </form>
  );
}

/**
 * Renaming one key, from its row.
 *
 * Identity only: the prefix and the secret stay, so renaming never breaks a
 * caller that already holds the key. The dialog is driven by the row that asked
 * for it — `apiKey` is `null` when it is closed.
 */
export function RenameApiKeyDialog({
  projectKey,
  apiKey,
  onClose,
}: {
  readonly projectKey: string;
  readonly apiKey: ApiKeyView | null;
  readonly onClose: () => void;
}) {
  return (
    <Dialog
      open={apiKey !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rename key</DialogTitle>
          <DialogDescription>
            {apiKey ? apiKey.maskedKey : ""} keeps its secret.
          </DialogDescription>
        </DialogHeader>

        {apiKey ? (
          <RenameApiKeyForm
            key={apiKey.id}
            projectKey={projectKey}
            apiKey={apiKey}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
