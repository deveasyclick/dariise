"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "lucide-react";
import { SettingsCard, SettingsRowLabel } from "@/components/app/settings-card";
import { ThemeChoice } from "@/components/app/theme-choice";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { EnvironmentOption } from "@/lib/environment-data";
import {
  notificationRows,
  type ProfileNotifications,
  type ProfilePreferences as ProfilePreferencesRecord,
} from "@/lib/profile-data";
import { updateNotifications, updatePreferences } from "@/lib/profile-stub";

const SAVED_HINT_MS = 2_000;

function useSavedHint() {
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  function acknowledge() {
    setSaved(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setSaved(false), SAVED_HINT_MS);
  }

  function reset() {
    setSaved(false);
  }

  return { saved, acknowledge, reset };
}

function SavedHint({ saved }: { saved: boolean }) {
  if (!saved) return null;

  return (
    <span className="text-ok-ink inline-flex items-center gap-1.5 text-[11px]">
      <CheckIcon aria-hidden="true" className="size-3.5" />
      Saved just now
    </span>
  );
}

export function ProfilePreferences({
  preferences,
  environments,
}: {
  preferences: ProfilePreferencesRecord;
  environments: EnvironmentOption[];
}) {
  const [current, setCurrent] = useState(preferences);
  const { saved, acknowledge, reset } = useSavedHint();
  const controllerRef = useRef<AbortController | null>(null);

  async function apply(patch: Partial<ProfilePreferencesRecord>) {
    const next = { ...current, ...patch };
    setCurrent(next);
    reset();
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await updatePreferences(next, controller.signal);
      acknowledge();
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") reset();
    }
  }

  return (
    <SettingsCard title="Preferences" action={<SavedHint saved={saved} />}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] font-medium">Theme</p>
          <ThemeChoice theme={current.theme} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-environment">Default environment</Label>
          <Select
            value={current.defaultEnvironmentKey}
            onValueChange={(value) => apply({ defaultEnvironmentKey: value })}
            disabled={environments.length === 0}
          >
            <SelectTrigger
              id="profile-environment"
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
      </div>
    </SettingsCard>
  );
}

export function ProfileNotifications({
  notifications,
}: {
  notifications: ProfileNotifications;
}) {
  const [current, setCurrent] = useState(notifications);
  const { saved, acknowledge, reset } = useSavedHint();
  const controllerRef = useRef<AbortController | null>(null);

  async function apply(next: ProfileNotifications) {
    setCurrent(next);
    reset();
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await updateNotifications(next, controller.signal);
      acknowledge();
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") reset();
    }
  }

  return (
    <SettingsCard title="Notifications" action={<SavedHint saved={saved} />}>
      <ul className="divide-y">
        {notificationRows.map((row) => (
          <li
            key={row.key}
            className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <SettingsRowLabel label={row.label} description={row.description} />
            <Switch
              checked={current[row.key]}
              onCheckedChange={(value) =>
                apply({ ...current, [row.key]: value })
              }
              aria-label={row.label}
              className="mt-0.5 shrink-0"
            />
          </li>
        ))}
      </ul>
    </SettingsCard>
  );
}
