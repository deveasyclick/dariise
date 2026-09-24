"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckIcon, LoaderCircleIcon, RocketIcon } from "lucide-react";
import { cn } from "cn";
import type {
  EnvironmentSummary,
  FlagCoverageRow,
  FlagCoverageState,
  InitialFlagState,
} from "@dariise/contracts";
import {
  ProtectedEnvironmentsNote,
  WhatYouGetCard,
} from "@/components/app/environments/environment-cards";
import {
  environmentColorSwatch,
  environmentColors,
} from "@/components/app/environments/environment-colors";
import { CreateEnvironmentHeader } from "@/components/app/environments/environment-headers";
import { CoverageStatePill } from "@/components/app/environments/coverage-pill";
import { Field, FieldError } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EnvironmentColor } from "@/lib/environment-color";
import * as api from "@/lib/api";
import { isRequired, isValidSlug, toWorkspaceSlug } from "@/lib/validation";

const steps = ["Details", "Flags", "Review"] as const;

const initialStatusOptions: Array<{
  value: InitialFlagState;
  label: string;
  hint: string;
}> = [
  { value: "all-off", label: "All off", hint: "Every flag starts disabled" },
  {
    value: "copy-source",
    label: "Copy source",
    hint: "Match the source environment",
  },
  { value: "all-on", label: "All on", hint: "Every flag starts enabled" },
];

interface CreateEnvironmentErrors {
  form?: string;
  name?: string;
  key?: string;
}

export function CreateEnvironmentForm({
  projectKey,
  environments,
  coverageFlags,
}: {
  projectKey: string;
  environments: EnvironmentSummary[];
  coverageFlags: FlagCoverageRow[];
}) {
  const defaultSource =
    environments.find((environment) => environment.isDefault)?.key ??
    environments[0]?.key ??
    "";

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [color, setColor] = useState<EnvironmentColor>("primary");
  const [copyFrom, setCopyFrom] = useState(defaultSource);
  const [initialStatus, setInitialStatus] =
    useState<InitialFlagState>("copy-source");
  const [editedKey, setEditedKey] = useState(false);
  const [errors, setErrors] = useState<CreateEnvironmentErrors>({});
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const sourceName =
    environments.find((environment) => environment.key === copyFrom)?.name ?? "";

  function clearError(field: keyof CreateEnvironmentErrors) {
    setErrors((previous) => ({
      ...previous,
      form: undefined,
      [field]: undefined,
    }));
  }

  function handleNameChange(value: string) {
    setName(value);
    // Keep the key in step with the name until the user takes it over.
    if (!editedKey) setKey(toWorkspaceSlug(value));
    clearError("name");
  }

  function validate(): CreateEnvironmentErrors {
    const next: CreateEnvironmentErrors = {
      name: isRequired(name, "Environment name") ?? undefined,
      key: isValidSlug(key, "Environment key", 2) ?? undefined,
    };

    if (!next.key && environments.some((item) => item.key === key.trim())) {
      next.key = "An environment with this key already exists.";
    }

    return next;
  }

  function goToStep(next: number) {
    const nextErrors = validate();
    setErrors(nextErrors);

    // Only the first step gates progress; Review is the confirmation.
    if (next > 0 && (nextErrors.name || nextErrors.key)) return;
    setStep(next);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const nextErrors = validate();
    if (nextErrors.name || nextErrors.key) {
      setErrors(nextErrors);
      setStep(0);
      return;
    }

    setErrors({});
    setPending(true);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await api.environments.create(
        projectKey,
        {
          name: name.trim(),
          key: key.trim(),
          color,
          copyFrom: copyFrom || undefined,
          initialFlagStatus: initialStatus,
        },
        { signal: controller.signal },
      );
      setCreated(true);
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;

      setErrors({
        form:
          error instanceof api.ApiError
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  if (created) {
    return (
      <>
        <CreateEnvironmentHeader steps={[...steps]} currentStep={2} />

        <div className="bg-card rounded-lg border p-6">
          <span className="bg-ok-ink/10 text-ok-ink flex size-9 items-center justify-center rounded-lg">
            <CheckIcon aria-hidden="true" className="size-4.5" />
          </span>
          <h2 className="mt-3 text-base font-semibold tracking-tight">
            {name.trim() || key.trim()} created
          </h2>
          <p className="text-muted-foreground mt-1 max-w-md text-[13px]">
            The environment and its flag configuration are saved. Issue an SDK
            key for it from the SDK keys tab when you are ready to connect a
            client.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/environments">Back to environments</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCreated(false);
                setStep(0);
                setName("");
                setKey("");
                setColor("primary");
                setCopyFrom(defaultSource);
                setInitialStatus("copy-source");
                setEditedKey(false);
              }}
            >
              Create another
            </Button>
          </div>
        </div>
      </>
    );
  }

  function previewState(flag: FlagCoverageRow): FlagCoverageState {
    if (initialStatus === "all-on") return { kind: "on" };
    if (initialStatus === "all-off") return { kind: "off" };

    return flag.states[copyFrom] ?? { kind: "off" };
  }

  const stepLabel = initialStatusOptions.find(
    (option) => option.value === initialStatus,
  )?.label;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <CreateEnvironmentHeader steps={[...steps]} currentStep={step} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.62fr)]">
        <div className="space-y-4">
          {step === 0 ? (
            <section className="bg-card rounded-lg border p-4">
              <h2 className="text-[13px] font-medium">Environment details</h2>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Field
                    id="environment-name"
                    label="Name"
                    name="name"
                    placeholder="QA Sandbox"
                    required
                    value={name}
                    error={errors.name}
                    onChange={(event) => handleNameChange(event.target.value)}
                  />
                  <p className="text-muted-foreground text-[11px]">
                    Shown across the dashboard and audit log.
                  </p>
                </div>

                <div className="space-y-2">
                  <Field
                    id="environment-key"
                    label="Key"
                    name="key"
                    required
                    value={key}
                    error={errors.key}
                    className="font-mono"
                    onChange={(event) => {
                      setEditedKey(true);
                      setKey(event.target.value);
                      clearError("key");
                    }}
                  />
                  <p className="text-muted-foreground text-[11px]">
                    Used in SDK keys and endpoints. Immutable after creation.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label asChild>
                    <p id="environment-color-label">Color</p>
                  </Label>
                  <RadioGroup
                    value={color}
                    onValueChange={(value) =>
                      setColor(value as EnvironmentColor)
                    }
                    aria-labelledby="environment-color-label"
                    className="flex flex-wrap items-center gap-2.5"
                  >
                    {environmentColors.map((option) => (
                      <RadioGroupItem
                        key={option.value}
                        value={option.value}
                        aria-label={`${option.label} color`}
                        title={option.label}
                        className={cn(
                          "size-6 data-checked:ring-2 data-checked:ring-foreground/40 data-checked:ring-offset-2",
                          environmentColorSwatch[option.value],
                        )}
                      />
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <h3 className="mt-6 text-[13px] font-medium">Configuration</h3>

              <div className="mt-3 space-y-2">
                <Label htmlFor="environment-copy-from">Copy settings from</Label>
                <Select
                  value={copyFrom}
                  onValueChange={setCopyFrom}
                  disabled={environments.length === 0}
                >
                  <SelectTrigger
                    id="environment-copy-from"
                    className="h-8 w-full text-[12px]"
                  >
                    <SelectValue placeholder="No other environment" />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map((environment) => (
                      <SelectItem
                        key={environment.key}
                        value={environment.key}
                      >
                        {environment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-[11px]">
                  Copies targeting rules and flag states from this environment.
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <Label asChild>
                  <p id="environment-initial-status-label">
                    Initial flag status
                  </p>
                </Label>
                <RadioGroup
                  value={initialStatus}
                  onValueChange={(value) =>
                    setInitialStatus(value as InitialFlagState)
                  }
                  aria-labelledby="environment-initial-status-label"
                  className="grid gap-2 sm:grid-cols-3"
                >
                  {initialStatusOptions.map((option) => {
                    const disabled =
                      option.value === "copy-source" &&
                      environments.length === 0;
                    const active = initialStatus === option.value;

                    return (
                      <Label
                        key={option.value}
                        htmlFor={`environment-status-${option.value}`}
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 font-normal transition-colors",
                          active
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50",
                          disabled &&
                            "cursor-not-allowed opacity-60 hover:bg-transparent",
                        )}
                      >
                        <RadioGroupItem
                          id={`environment-status-${option.value}`}
                          value={option.value}
                          disabled={disabled}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="block text-[12px] font-medium">
                            {option.label}
                          </span>
                          <span className="text-muted-foreground block text-[10px] leading-4">
                            {disabled
                              ? "No environment to copy from"
                              : option.hint}
                          </span>
                        </span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="bg-card rounded-lg border p-4">
              <h2 className="text-[13px] font-medium">Initial flag states</h2>
              <p className="text-muted-foreground mt-1 text-[12px]">
                {initialStatus === "copy-source"
                  ? `Targeting rules and flag states are copied from ${sourceName || "the source environment"}.`
                  : `Every flag starts ${initialStatus === "all-on" ? "enabled" : "disabled"}, with no targeting rules.`}
              </p>

              <ul className="mt-4 divide-y">
                {coverageFlags.map((flag) => (
                  <li
                    key={flag.key}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span className="truncate font-mono text-[12px]">
                      {flag.key}
                    </span>
                    <CoverageStatePill state={previewState(flag)} />
                  </li>
                ))}
              </ul>

              {coverageFlags.length === 0 ? (
                <p className="text-muted-foreground mt-4 text-[11px]">
                  This project has no flags yet, so there is nothing to
                  configure.
                </p>
              ) : (
                <p className="text-muted-foreground mt-4 text-[11px]">
                  The preview shows each flag&apos;s starting state in this
                  environment.
                </p>
              )}
            </section>
          ) : null}

          {step === 2 ? (
            <section className="bg-card rounded-lg border p-4">
              <h2 className="text-[13px] font-medium">Review</h2>
              <p className="text-muted-foreground mt-1 text-[12px]">
                Check the configuration before creating the environment.
              </p>

              <dl className="mt-4 divide-y text-[12px]">
                {[
                  ["Name", name || "—"],
                  ["Key", key || "—"],
                  [
                    "Color",
                    environmentColors.find((item) => item.value === color)
                      ?.label ?? color,
                  ],
                  ["Copy settings from", sourceName || "—"],
                  ["Initial flag status", stepLabel ?? "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-4 py-2"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="max-w-[60%] text-right break-words">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4">
                <p className="text-muted-foreground mb-2 text-[11px]">
                  The environment is created with its own flag configuration.
                  SDK keys are issued separately.
                </p>
                <pre className="bg-muted overflow-x-auto rounded-lg border p-3 text-[11px] leading-5">
                  <code className="font-mono">
                    {JSON.stringify(
                      {
                        name: name.trim(),
                        key: key.trim() || "environment-key",
                        color,
                        copyFrom: copyFrom || null,
                        initialFlagStatus: initialStatus,
                      },
                      null,
                      2,
                    )}
                  </code>
                </pre>
              </div>
            </section>
          ) : null}

          {errors.form ? <FieldError>{errors.form}</FieldError> : null}

          <div className="flex items-center justify-between gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/environments">Cancel</Link>
            </Button>

            <div className="flex items-center gap-2">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => goToStep(step - 1)}
                >
                  Back
                </Button>
              ) : null}

              {step < steps.length - 1 ? (
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => goToStep(step + 1)}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  className="gap-1.5"
                  disabled={pending}
                >
                  {pending ? (
                    <LoaderCircleIcon className="animate-spin" />
                  ) : (
                    <RocketIcon aria-hidden="true" className="size-3.5" />
                  )}
                  {pending ? "Creating…" : "Create Environment"}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <WhatYouGetCard />
          <ProtectedEnvironmentsNote />
        </div>
      </div>
    </form>
  );
}
