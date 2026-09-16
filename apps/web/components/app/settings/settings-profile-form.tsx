"use client";

import { useRef, useState } from "react";
import { CheckIcon, LoaderCircleIcon } from "lucide-react";
import { SettingsCard } from "@/components/app/settings-card";
import { Field, FieldError } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EnvironmentOption } from "@/lib/environment-data";
import { timezoneOptions, type WorkspaceProfile } from "@/lib/settings-data";
import { isRequired } from "@/lib/validation";
import { updateWorkspaceProfile } from "@/lib/workspace-stub";

interface ProfileErrors {
  form?: string;
  name?: string;
}

interface ProfileDraft {
  name: string;
  defaultEnvironmentKey: string;
  timezone: string;
}

/**
 * Workspace profile.
 *
 * Local state until Save is pressed, matching the environment settings card: the
 * write goes through the stub, so the unsaved and saved states are real even
 * though nothing is persisted. Saving does not rename the sidebar for the
 * session — the chrome reads the fixture, and a reload discards the change.
 */
export function SettingsProfileForm({
  profile,
  environments,
  workspaceUrl,
}: {
  profile: WorkspaceProfile;
  environments: EnvironmentOption[];
  /** Read-only projection of the workspace slug. */
  workspaceUrl: string;
}) {
  const initial: ProfileDraft = {
    name: profile.name,
    defaultEnvironmentKey: profile.defaultEnvironmentKey,
    timezone: profile.timezone,
  };

  const [draft, setDraft] = useState<ProfileDraft>(initial);
  const [baseline, setBaseline] = useState<ProfileDraft>(initial);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const dirty =
    draft.name !== baseline.name ||
    draft.defaultEnvironmentKey !== baseline.defaultEnvironmentKey ||
    draft.timezone !== baseline.timezone;

  function update(patch: Partial<ProfileDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
    setErrors((current) => ({ ...current, form: undefined, name: undefined }));
  }

  async function handleSave() {
    if (pending || !dirty) return;

    const nameError = isRequired(draft.name, "Workspace name");
    if (nameError) {
      setErrors({ name: nameError });
      return;
    }

    setErrors({});
    setPending(true);
    setSaved(false);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const next: ProfileDraft = { ...draft, name: draft.name.trim() };

    try {
      await updateWorkspaceProfile(next, controller.signal);
      // A local acknowledgement only — moving the baseline is what lets the
      // footer say "Saved" instead of "Unsaved".
      setDraft(next);
      setBaseline(next);
      setSaved(true);
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <SettingsCard
      title="Workspace profile"
      description="This information appears across the dashboard and in audit exports."
      footer={
        <div className="flex items-center justify-between gap-3">
          {saved && !dirty ? (
            <span className="text-ok-ink inline-flex items-center gap-1.5 text-[11px]">
              <CheckIcon aria-hidden="true" className="size-3.5" />
              Saved just now
            </span>
          ) : (
            <span className="text-muted-foreground text-[11px]">
              {dirty ? "Unsaved changes" : "No changes"}
            </span>
          )}

          <Button
            type="button"
            size="sm"
            className="gap-1.5 text-[11px]"
            disabled={pending || !dirty}
            onClick={handleSave}
          >
            {pending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <CheckIcon aria-hidden="true" className="size-3.5" />
            )}
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field
          id="workspace-name"
          label="Workspace name"
          name="name"
          placeholder="Acme Inc"
          required
          maxLength={60}
          value={draft.name}
          error={errors.name}
          onChange={(event) => update({ name: event.target.value })}
        />

        <div className="space-y-2">
          <Label htmlFor="workspace-url">Workspace URL</Label>
          <Input
            id="workspace-url"
            value={workspaceUrl}
            readOnly
            disabled
            title="The workspace URL is fixed once the workspace exists."
            className="font-mono text-[12px]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="workspace-environment">Default environment</Label>
            <Select
              value={draft.defaultEnvironmentKey}
              onValueChange={(value) =>
                update({ defaultEnvironmentKey: value })
              }
              disabled={environments.length === 0}
            >
              <SelectTrigger
                id="workspace-environment"
                className="h-8 w-full text-[12px]"
              >
                <SelectValue placeholder="No environment" />
              </SelectTrigger>
              <SelectContent>
                {environments.map((environment) => (
                  <SelectItem key={environment.key} value={environment.key}>
                    {environment.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-timezone">Timezone</Label>
            <Select
              value={draft.timezone}
              onValueChange={(value) => update({ timezone: value })}
            >
              <SelectTrigger
                id="workspace-timezone"
                className="h-8 w-full text-[12px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezoneOptions.map((timezone) => (
                  <SelectItem key={timezone} value={timezone}>
                    {timezone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {errors.form ? <FieldError>{errors.form}</FieldError> : null}
      </div>
    </SettingsCard>
  );
}
