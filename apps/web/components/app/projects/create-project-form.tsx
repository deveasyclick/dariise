"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckIcon, LoaderCircleIcon, PlusIcon } from "lucide-react";
import { cn } from "cn";
import {
  environmentColors,
  environmentColorSwatch,
} from "@/components/app/environments/environment-colors";
import { ProjectWhatYouGetCard } from "@/components/app/projects/project-cards";
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
import { Switch } from "@/components/ui/switch";
import type { EnvironmentColor } from "@/lib/environment-data";
import { environmentPresets, getProjectKeys } from "@/lib/project-data";
import { createProject, type InitialFlagState } from "@/lib/project-stub";
import { isRequired, isValidSlug, toWorkspaceSlug } from "@/lib/validation";

const initialFlagStateOptions: Array<{
  value: InitialFlagState;
  label: string;
  hint: string;
}> = [
  {
    value: "all-off",
    label: "All off",
    hint: "Every flag starts disabled",
  },
  {
    value: "copy-source",
    label: "Copy from project",
    hint: "Copies flag states from an existing project",
  },
  { value: "all-on", label: "All on", hint: "Every flag starts enabled" },
];

interface CreateProjectErrors {
  form?: string;
  name?: string;
  key?: string;
}

/**
 * Create-project form for the dashboard.
 *
 * Every section of the design sits on one screen, so the step path in the
 * header is a progress path rather than a wizard: the sections below are named
 * in the order it lists them. Writes go through the project stub, which
 * simulates the round-trip so the pending and success states are real.
 */
export function CreateProjectForm() {
  const defaultPreset = environmentPresets[0];
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [color, setColor] = useState<EnvironmentColor>("primary");
  const [preset, setPreset] = useState(defaultPreset.value);
  const [initialFlagState, setInitialFlagState] =
    useState<InitialFlagState>("copy-source");
  const [defaultEnvironment, setDefaultEnvironment] = useState(
    defaultPreset.environments[defaultPreset.environments.length - 1],
  );
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [editedKey, setEditedKey] = useState(false);
  const [errors, setErrors] = useState<CreateProjectErrors>({});
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const environments =
    environmentPresets.find((item) => item.value === preset)?.environments ??
    defaultPreset.environments;

  function clearError(field: keyof CreateProjectErrors) {
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

  function handlePresetChange(value: string) {
    setPreset(value);

    const next =
      environmentPresets.find((item) => item.value === value)?.environments ??
      defaultPreset.environments;

    if (!next.includes(defaultEnvironment)) {
      setDefaultEnvironment(next[next.length - 1]);
    }
  }

  function validate(): CreateProjectErrors {
    const next: CreateProjectErrors = {
      name: isRequired(name, "Project name") ?? undefined,
      key: isValidSlug(key, "Project key", 2) ?? undefined,
    };

    if (!next.key && getProjectKeys().includes(key.trim())) {
      next.key = "A project with this key already exists.";
    }

    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const nextErrors = validate();
    if (nextErrors.name || nextErrors.key) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setPending(true);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await createProject(
        {
          name: name.trim(),
          key: key.trim(),
          color,
          preset,
          initialFlagState,
          defaultEnvironment,
          setAsDefault,
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
      <div className="bg-card rounded-lg border p-6">
        <span className="bg-ok-ink/10 text-ok-ink flex size-9 items-center justify-center rounded-lg">
          <CheckIcon aria-hidden="true" className="size-4.5" />
        </span>
        <h2 className="mt-3 text-base font-semibold tracking-tight">
          {name.trim() || key.trim()} created
        </h2>
        <p className="text-muted-foreground mt-1 max-w-md text-[13px]">
          The project exists in this preview only — the API is not wired up yet,
          so nothing was saved and no environments or keys were issued.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/projects">Back to projects</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCreated(false);
              setName("");
              setKey("");
              setColor("primary");
              setPreset(defaultPreset.value);
              setInitialFlagState("copy-source");
              setDefaultEnvironment(
                defaultPreset.environments[
                  defaultPreset.environments.length - 1
                ],
              );
              setSetAsDefault(false);
              setEditedKey(false);
            }}
          >
            Create another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.42fr)]">
        <section className="bg-card rounded-lg border p-4">
          <h2 className="text-[13px] font-medium">Project details</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <Field
              id="create-project-name"
              label="Name"
              name="name"
              autoComplete="off"
              placeholder="Checkout Platform"
              required
              value={name}
              error={errors.name}
              onChange={(event) => handleNameChange(event.target.value)}
            />

            <Field
              id="create-project-key"
              label="Key"
              name="key"
              autoComplete="off"
              placeholder="checkout-platform"
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

            <div className="space-y-2">
              <Label asChild>
                <p id="create-project-color-label">Color</p>
              </Label>
              <RadioGroup
                value={color}
                onValueChange={(value) => setColor(value as EnvironmentColor)}
                aria-labelledby="create-project-color-label"
                className="flex h-8 items-center gap-2.5"
              >
                {environmentColors.map((option) => (
                  <RadioGroupItem
                    key={option.value}
                    value={option.value}
                    aria-label={`${option.label} color`}
                    title={option.label}
                    className={cn(
                      "size-5 data-checked:ring-2 data-checked:ring-foreground/40 data-checked:ring-offset-2",
                      environmentColorSwatch[option.value],
                    )}
                  />
                ))}
              </RadioGroup>
            </div>
          </div>

          <p className="text-muted-foreground mt-2 text-[11px] leading-5">
            Shown in the project switcher, dashboards, and audit log. Keys are
            API paths. Immutable after creation.
          </p>

          <h3 className="mt-6 text-[13px] font-medium">Environments</h3>

          <div className="mt-3 space-y-2">
            <Label htmlFor="create-project-preset">Environment preset</Label>
            <Select value={preset} onValueChange={handlePresetChange}>
              <SelectTrigger
                id="create-project-preset"
                className="h-8 w-full text-[12px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {environmentPresets.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} · {option.environments.join(", ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-[11px]">
              Creates the default environments in this project.
            </p>
          </div>

          <h3 className="mt-6 text-[13px] font-medium">Initial flag states</h3>

          <RadioGroup
            value={initialFlagState}
            onValueChange={(value) =>
              setInitialFlagState(value as InitialFlagState)
            }
            aria-label="Initial flag states"
            className="mt-3 grid gap-2 sm:grid-cols-3"
          >
            {initialFlagStateOptions.map((option) => {
              const active = initialFlagState === option.value;

              return (
                <Label
                  key={option.value}
                  htmlFor={`create-project-flags-${option.value}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 font-normal transition-colors",
                    active ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                  )}
                >
                  <RadioGroupItem
                    id={`create-project-flags-${option.value}`}
                    value={option.value}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-[12px] font-medium">
                      {option.label}
                    </span>
                    <span className="text-muted-foreground block text-[10px] leading-4">
                      {option.hint}
                    </span>
                  </span>
                </Label>
              );
            })}
          </RadioGroup>

          <h3 className="mt-6 text-[13px] font-medium">Default environment</h3>

          <div className="mt-3 space-y-2">
            <Select
              value={defaultEnvironment}
              onValueChange={setDefaultEnvironment}
            >
              <SelectTrigger
                id="create-project-default-environment"
                aria-label="Default environment"
                className="h-8 w-full text-[12px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {environments.map((environment) => (
                  <SelectItem key={environment} value={environment}>
                    {environment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-[11px]">
              Flags resolve here unless an environment override is set.
            </p>
          </div>

          {errors.form ? <FieldError>{errors.form}</FieldError> : null}

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/projects">Cancel</Link>
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <PlusIcon aria-hidden="true" />
              )}
              {pending ? "Creating project…" : "Create project"}
            </Button>
          </div>
        </section>

        <div className="space-y-3">
          <ProjectWhatYouGetCard />

          <section className="border-info-ink/20 bg-info-ink/5 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-info-ink text-[12px] font-medium">
                  Set as default project
                </h2>
                <p className="text-muted-foreground mt-1 text-[11px] leading-5">
                  New members land in this project. New API keys default to its{" "}
                  {defaultEnvironment} environment.
                </p>
              </div>
              <Switch
                checked={setAsDefault}
                onCheckedChange={setSetAsDefault}
                aria-label="Set as default project"
              />
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
