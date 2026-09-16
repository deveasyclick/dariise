"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, PlusIcon } from "lucide-react";
import {
  SettingsCard,
  SettingsRowLabel,
} from "@/components/app/settings-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  auditRetentionOptions,
  sessionTimeoutOptions,
  type SecuritySettings,
  type SessionTimeout,
} from "@/lib/settings-data";
import { updateWorkspaceSecurity } from "@/lib/workspace-stub";

/** How long the acknowledgement stays on screen, in milliseconds. */
const SAVED_HINT_MS = 2_000;

/**
 * Sign-in and access-control settings.
 *
 * The design has no Save button here, so each control applies as soon as it
 * changes: the change goes through the stub and the card header acknowledges it
 * briefly. Nothing is persisted, and the acknowledgement is honest about that by
 * disappearing rather than implying a stored preference.
 */
export function SettingsSecurity({
  settings,
}: {
  settings: SecuritySettings;
}) {
  const [current, setCurrent] = useState<SecuritySettings>(settings);
  const [saved, setSaved] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  async function apply(patch: Partial<SecuritySettings>) {
    const next = { ...current, ...patch };
    setCurrent(next);
    setSaved(false);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await updateWorkspaceSecurity(next, controller.signal);
      setSaved(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(
        () => setSaved(false),
        SAVED_HINT_MS,
      );
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") setSaved(false);
    }
  }

  const savedHint = saved ? (
    <span className="text-ok-ink inline-flex items-center gap-1.5 text-[11px]">
      <CheckIcon aria-hidden="true" className="size-3.5" />
      Saved just now
    </span>
  ) : null;

  return (
    <div className="space-y-3">
      <SettingsCard
        title="Authentication"
        description="Control how members sign in and stay authenticated."
        action={savedHint}
      >
        <ul className="divide-y">
          <li className="flex flex-wrap items-center justify-between gap-3 pb-3">
            <SettingsRowLabel
              label="Single sign-on (SAML)"
              description="Authenticate through your identity provider."
            />

            <div className="flex shrink-0 items-center gap-2">
              {current.ssoConnected ? (
                <Badge variant="ok" className="gap-1.5">
                  <span
                    aria-hidden="true"
                    className="bg-ok-ink size-1.5 rounded-full"
                  />
                  {current.ssoProvider} · Connected
                </Badge>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Managing single sign-on — coming soon"
                className="text-[11px]"
              >
                Manage
              </Button>
            </div>
          </li>

          <li className="flex flex-wrap items-center justify-between gap-3 py-3">
            <SettingsRowLabel
              label="Two-factor authentication"
              description="Require 2FA for every workspace member."
            />
            <Switch
              checked={current.twoFactorEnabled}
              onCheckedChange={(value) =>
                apply({ twoFactorEnabled: value })
              }
              aria-label="Require two-factor authentication"
              className="shrink-0"
            />
          </li>

          <li className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <SettingsRowLabel
              label="Session timeout"
              description="Sign members out after a period of inactivity."
            />
            <Select
              value={current.sessionTimeout}
              onValueChange={(value) =>
                apply({ sessionTimeout: value as SessionTimeout })
              }
            >
              <SelectTrigger
                aria-label="Session timeout"
                className="h-8 w-28 shrink-0 text-[11px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sessionTimeoutOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </li>
        </ul>
      </SettingsCard>

      <SettingsCard
        title="Access control"
        description="Restrict who can reach the workspace and how long activity is retained."
        action={savedHint}
      >
        <ul className="divide-y">
          <li className="flex flex-wrap items-center justify-between gap-3 pb-3">
            <SettingsRowLabel
              label="Allowed email domains"
              description="Only these domains can be invited to the workspace."
            />

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {current.allowedEmailDomains.map((domain) => (
                <span
                  key={domain}
                  className="bg-muted text-muted-foreground rounded-md px-2.5 py-1.5 font-mono text-[11px]"
                >
                  {domain}
                </span>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Adding a domain — coming soon"
                className="gap-1.5 text-[11px]"
              >
                <PlusIcon aria-hidden="true" className="size-3.5" />
                Add
              </Button>
            </div>
          </li>

          <li className="flex flex-wrap items-center justify-between gap-3 py-3">
            <SettingsRowLabel
              label="IP allowlist"
              description="Restrict dashboard access to trusted networks."
            />
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Configuring an IP allowlist — coming soon"
              className="shrink-0 text-[11px]"
            >
              Configure
            </Button>
          </li>

          <li className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <SettingsRowLabel
              label="Audit log retention"
              description="How long activity history is kept and exportable."
            />
            <Select
              value={String(current.auditRetentionDays)}
              onValueChange={(value) =>
                apply({ auditRetentionDays: Number(value) })
              }
            >
              <SelectTrigger
                aria-label="Audit log retention"
                className="h-8 w-28 shrink-0 text-[11px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {auditRetentionOptions.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </li>
        </ul>
      </SettingsCard>
    </div>
  );
}
