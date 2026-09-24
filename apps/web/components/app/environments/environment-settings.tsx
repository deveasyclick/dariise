"use client";

import { useRef, useState } from "react";
import { CheckIcon, LoaderCircleIcon, SaveIcon } from "lucide-react";
import type { EnvironmentDetail, EnvironmentSettings } from "@dariise/contracts";
import { FieldError } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import * as api from "@/lib/api";

/**
 * Environment settings.
 *
 * The switches are local state until Save is pressed; the write goes through
 * `environments.updateSettings` and the response's settings become the new
 * baseline, so "Saved" means the API accepted the change rather than a local
 * acknowledgement.
 */

interface SettingRow {
  key: keyof EnvironmentSettings;
  label: string;
  description: string;
}

const rows: SettingRow[] = [
  {
    key: "protectedEnvironment",
    label: "Protected environment",
    description: "Require approval before publishing changes",
  },
  {
    key: "requireApprovals",
    label: "Require approvals",
    description: "Two-person review for flag changes",
  },
  {
    key: "singleUseSdkKeys",
    label: "Single-use SDK keys",
    description: "Rotate keys after each evaluation session",
  },
];

export function EnvironmentSettingsCard({
  projectKey,
  environment,
}: {
  projectKey: string;
  environment: Pick<EnvironmentDetail, "key" | "name" | "settings">;
}) {
  const [settings, setSettings] = useState<EnvironmentSettings>(
    environment.settings,
  );
  const [baseline, setBaseline] = useState<EnvironmentSettings>(
    environment.settings,
  );
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const dirty = rows.some((row) => settings[row.key] !== baseline[row.key]);

  function toggle(key: keyof EnvironmentSettings, value: boolean) {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setError(null);
  }

  async function handleSave() {
    if (pending || !dirty) return;
    setPending(true);
    setSaved(false);
    setError(null);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const updated = await api.environments.updateSettings(
        projectKey,
        environment.key,
        settings,
        { signal: controller.signal },
      );

      setSettings(updated.settings);
      setBaseline(updated.settings);
      setSaved(true);
    } catch (caught) {
      if ((caught as Error)?.name === "AbortError") return;

      setSaved(false);
      setError(
        caught instanceof api.ApiError
          ? caught.message
          : "The settings could not be saved. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="bg-card rounded-lg border p-4">
      <h2 className="text-[13px] font-medium">Settings</h2>

      <ul className="mt-2 divide-y">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-start justify-between gap-4 py-3 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-[12px] font-medium">{row.label}</p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                {row.description}
              </p>
            </div>

            <Switch
              checked={settings[row.key]}
              onCheckedChange={(value) => toggle(row.key, value)}
              aria-label={`${row.label} in ${environment.name}`}
              className="mt-0.5"
            />
          </li>
        ))}
      </ul>

      {error ? (
        <div className="mt-3">
          <FieldError>{error}</FieldError>
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
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
            <SaveIcon aria-hidden="true" className="size-3.5" />
          )}
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </section>
  );
}
