"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { InfoIcon, LoaderCircleIcon } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { AccessTabs } from "@/components/auth/access-tabs";
import { Field, FieldError, FieldRow } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createWorkspace } from "@/lib/auth-stub";
import {
  isRequired,
  isValidOptionalUrl,
  isValidWorkspaceSlug,
  toWorkspaceSlug,
} from "@/lib/validation";

interface CreateWorkspaceErrors {
  form?: string;
  name?: string;
  website?: string;
  slug?: string;
}

export function CreateWorkspaceForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [website, setWebsite] = useState("");
  const [receiveProductUpdates, setReceiveProductUpdates] = useState(false);
  const [editedSlug, setEditedSlug] = useState(false);
  const [errors, setErrors] = useState<CreateWorkspaceErrors>({});
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  function clearError(field: keyof CreateWorkspaceErrors) {
    setErrors((previous) => ({ ...previous, form: undefined, [field]: undefined }));
  }

  function handleNameChange(value: string) {
    setName(value);
    // Keep the slug in step with the name until the user takes it over.
    if (!editedSlug) setSlug(toWorkspaceSlug(value));
    clearError("name");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const nextErrors: CreateWorkspaceErrors = {
      name: isRequired(name, "Workspace name") ?? undefined,
      slug: isValidWorkspaceSlug(slug) ?? undefined,
      website: isValidOptionalUrl(website) ?? undefined,
    };

    if (nextErrors.name || nextErrors.slug || nextErrors.website) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setPending(true);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await createWorkspace(
        {
          name: name.trim(),
          slug: slug.trim(),
          website: website.trim(),
          receiveProductUpdates,
        },
        controller.signal,
      );
      setCreated(true);
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setPending(false);
    }
  }

  if (created) {
    return (
      <AuthCard
        title="Workspace created"
        description="Your workspace is ready. The dashboard is not wired to the API yet — this is a preview of the onboarding flow."
      >
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/overview">View dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Back to sign in</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your workspace"
      description="Your workspace is where your projects and feature flags live. You can rename it later."
      backLink={<AccessTabs current="workspace" />}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          id="create-workspace-name"
          label="Workspace name"
          name="name"
          autoComplete="organization"
          placeholder="Acme Inc."
          required
          value={name}
          error={errors.name}
          onChange={(event) => handleNameChange(event.target.value)}
        />

        <Field
          id="create-workspace-website"
          label="Website (optional)"
          name="website"
          autoComplete="url"
          placeholder="https://acme.com"
          value={website}
          error={errors.website}
          onChange={(event) => {
            setWebsite(event.target.value);
            clearError("website");
          }}
        />

        <div className="space-y-2">
          <Field
            id="create-workspace-slug"
            label="Workspace slug"
            name="slug"
            placeholder="acme"
            required
            value={slug}
            error={errors.slug}
            onChange={(event) => {
              setEditedSlug(true);
              setSlug(event.target.value);
              clearError("slug");
            }}
          />
          <p className="text-muted-foreground text-xs">
            {slug.trim()
              ? `${slug.trim()}.dariise.dev`
              : "Used in your workspace URL."}
          </p>
        </div>

        <div className="border-info-ink/30 bg-info-ink/5 flex items-start gap-2.5 rounded-lg border p-3">
          <InfoIcon
            aria-hidden="true"
            className="text-info-ink mt-0.5 size-4 shrink-0"
          />
          <p className="text-muted-foreground text-xs leading-5">
            We&apos;ll verify your workspace before you can publish domains or
            invite teammates.
          </p>
        </div>

        <FieldRow
          htmlFor="create-workspace-updates"
          control={
            <Checkbox
              id="create-workspace-updates"
              name="receiveProductUpdates"
              checked={receiveProductUpdates}
              onCheckedChange={(checked) =>
                setReceiveProductUpdates(checked === true)
              }
            />
          }
        >
          Send me occasional product updates. You can opt out at any time.
        </FieldRow>

        {errors.form ? <FieldError>{errors.form}</FieldError> : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          {pending ? "Creating workspace…" : "Create workspace"}
        </Button>
      </form>
    </AuthCard>
  );
}
