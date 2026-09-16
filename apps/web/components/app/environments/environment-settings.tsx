"use client";

import { useRef, useState } from "react";
import { CheckIcon, LoaderCircleIcon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { EnvironmentSettings, EnvironmentView } from "@/lib/environment-data";
import { updateEnvironmentSettings } from "@/lib/environment-stub";

/**
 * Environment settings.
 *
 * The switches are local state until Save is pressed, matching the flag
 * Configuration tab: the write goes through the stub, so the pending and saved
 * states are real even though nothing is persisted.
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
  environment,
}: {
  environment: Pick<EnvironmentView, "key" | "name" | "settings">;
}) {
  const [settings, setSettings] = useState<EnvironmentSettings>(
    environment.settings,
  );
  const [baseline, setBaseline] = useState<EnvironmentSettings>(
    environment.settings,
  );
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const dirty = rows.some((row) => settings[row.key] !== baseline[row.key]);

  function toggle(key: keyof EnvironmentSettings, value: boolean) {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    if (pending || !dirty) return;
    setPending(true);
    setSaved(false);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await updateEnvironmentSettings(
        { key: environment.key, settings },
        controller.signal,
      );
      // A local acknowledgement only — nothing is persisted. Moving the
      // baseline is what lets the footer say "Saved" instead of "Unsaved".
      setBaseline(settings);
      setSaved(true);
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") setSaved(false);
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
