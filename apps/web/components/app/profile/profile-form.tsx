"use client";

import { useRef, useState } from "react";
import { CameraIcon, CheckIcon, LoaderCircleIcon } from "lucide-react";
import { SettingsCard } from "@/components/app/settings-card";
import { Field, FieldError } from "@/components/auth/field";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ProfileRecord } from "@/lib/profile-data";
import { isEmail, isRequired } from "@/lib/validation";
import { updateProfile } from "@/lib/profile-stub";

interface ProfileErrors {
  form?: string;
  name?: string;
  email?: string;
}

interface ProfileDraft {
  name: string;
  email: string;
}

/**
 * The personal Profile card.
 *
 * Local state until Save is pressed, matching the workspace profile card in
 * Settings: the write goes through the stub, so the unsaved and saved states are
 * real even though nothing is persisted — and the chrome keeps rendering the
 * fixture identity after a save.
 */
export function ProfileForm({ profile }: { profile: ProfileRecord }) {
  const initial: ProfileDraft = { name: profile.name, email: profile.email };

  const [draft, setDraft] = useState<ProfileDraft>(initial);
  const [baseline, setBaseline] = useState<ProfileDraft>(initial);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const dirty =
    draft.name !== baseline.name || draft.email !== baseline.email;

  function update(patch: Partial<ProfileDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
    setErrors((current) => ({
      ...current,
      form: undefined,
      name: undefined,
      email: undefined,
    }));
  }

  async function handleSave() {
    if (pending || !dirty) return;

    const nextErrors: ProfileErrors = {
      name: isRequired(draft.name, "Full name") ?? undefined,
      email: isEmail(draft.email) ?? undefined,
    };
    if (nextErrors.name || nextErrors.email) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setPending(true);
    setSaved(false);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const next: ProfileDraft = {
      name: draft.name.trim(),
      email: draft.email.trim(),
    };

    try {
      await updateProfile(next, controller.signal);
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
      title="Profile"
      description="This is how you appear to teammates across the workspace."
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
        <div className="flex flex-wrap items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback className="bg-nav-active text-[12px] font-medium text-white">
              {profile.initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{profile.name}</p>
            <p className="text-muted-foreground truncate text-[11px]">
              {profile.email}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled
            title="Changing your photo — coming soon"
            className="shrink-0 gap-1.5 text-[11px]"
          >
            <CameraIcon aria-hidden="true" className="size-3.5" />
            Change photo
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="profile-name"
            label="Full name"
            name="name"
            required
            maxLength={60}
            value={draft.name}
            error={errors.name}
            onChange={(event) => update({ name: event.target.value })}
          />

          <Field
            id="profile-email"
            label="Email"
            name="email"
            type="email"
            required
            value={draft.email}
            error={errors.email}
            onChange={(event) => update({ email: event.target.value })}
          />
        </div>

        {errors.form ? <FieldError>{errors.form}</FieldError> : null}
      </div>
    </SettingsCard>
  );
}
