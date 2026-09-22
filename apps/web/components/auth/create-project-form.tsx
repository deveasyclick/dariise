"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CornerDownRightIcon,
  LoaderCircleIcon,
  PanelsTopLeftIcon,
} from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { OnboardingSteps } from "@/components/auth/onboarding-steps";
import { Field, FieldError } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { AuthError, createProject } from "@/lib/auth";
import { isRequired } from "@/lib/validation";

/** The environment every project is created with, and its fallback label. */
const defaultEnvironmentName = "Development";

interface CreateProjectErrors {
  form?: string;
  name?: string;
  environment?: string;
}

export function CreateProjectForm() {
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState(defaultEnvironmentName);
  const [errors, setErrors] = useState<CreateProjectErrors>({});
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const controllerRef = useRef<AbortController | null>(null);

  function clearError(field: keyof CreateProjectErrors) {
    setErrors((previous) => ({
      ...previous,
      form: undefined,
      [field]: undefined,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const nextErrors: CreateProjectErrors = {
      name: isRequired(name, "Project name") ?? undefined,
      environment: isRequired(environment, "Environment name") ?? undefined,
    };

    if (nextErrors.name || nextErrors.environment) {
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
        { name: name.trim(), environmentName: environment.trim() },
        controller.signal,
      );

      router.refresh();
      router.push("/overview");
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;

      if (error instanceof AuthError) {
        setErrors((previous) => ({
          ...previous,
          ...(error.fieldErrors as CreateProjectErrors),
        }));
        return;
      }

      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      steps={<OnboardingSteps current="project" />}
      title="Welcome to Dariise"
      description="Let's set up your first project. You can rename it or add more environments later."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          id="create-project-name"
          label="Project name"
          name="name"
          autoComplete="off"
          placeholder="My E-commerce App"
          required
          value={name}
          error={errors.name}
          onChange={(event) => {
            setName(event.target.value);
            clearError("name");
          }}
        />

        <Field
          id="create-project-environment"
          label="Environment name"
          name="environment"
          autoComplete="off"
          placeholder={defaultEnvironmentName}
          required
          value={environment}
          error={errors.environment}
          hint="Flags, SDK keys and rollouts are all scoped to an environment."
          onChange={(event) => {
            setEnvironment(event.target.value);
            clearError("environment");
          }}
        />

        <ProjectSummaryCard
          projectName={name.trim() || "Untitled project"}
          environmentName={environment.trim() || defaultEnvironmentName}
        />

        {errors.form ? <FieldError>{errors.form}</FieldError> : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          {pending ? "Creating project…" : "Create Project"}
          {pending ? null : (
            <ArrowRightIcon aria-hidden="true" className="size-3.5" />
          )}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-xs leading-5">
        You can add more environments any time from the environment switcher.
      </p>
    </AuthCard>
  );
}

interface ProjectSummaryCardProps {
  projectName: string;
  environmentName: string;
}

function ProjectSummaryCard({
  projectName,
  environmentName,
}: ProjectSummaryCardProps) {
  return (
    <section className="bg-muted rounded-lg p-4">
      <h2 className="text-muted-foreground text-[10px] font-medium tracking-[0.1em] uppercase">
        We&apos;ll create
      </h2>

      <div className="mt-3 flex items-center gap-2.5">
        <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-md">
          <PanelsTopLeftIcon aria-hidden="true" className="size-3.5" />
        </span>
        <span className="truncate text-[13px] font-medium">{projectName}</span>
      </div>

      <div className="mt-2 flex items-center gap-2.5">
        <CornerDownRightIcon
          aria-hidden="true"
          className="text-muted-foreground size-3.5 shrink-0"
        />
        <span
          aria-hidden="true"
          className="bg-success size-1.5 shrink-0 rounded-full"
        />
        <span className="truncate text-[13px] font-medium">
          {environmentName}
        </span>
        <span className="text-muted-foreground shrink-0 text-[11px]">
          default environment
        </span>
      </div>
    </section>
  );
}
