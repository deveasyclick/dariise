"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  CheckIcon,
  LoaderCircleIcon,
  RocketIcon,
  TagIcon,
  XIcon,
} from "lucide-react";
import {
  createFlagSchema,
  toFieldErrors,
  type CreateFlagInput,
  type FieldErrors,
  type FlagType,
} from "@dariise/contracts";
import { cn } from "cn";
import { CreateFlagHeader } from "@/components/app/flags/flag-headers";
import { SdkPreview, sdkSnippet } from "@/components/app/flags/sdk-preview";
import { Field, FieldError } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, flags as flagsApi } from "@/lib/api";
import { toWorkspaceSlug } from "@/lib/validation";

const steps = ["Details", "Targeting", "Review"] as const;

const flagTypes: Array<{
  value: FlagType;
  label: string;
  hint: string;
}> = [
  { value: "boolean", label: "Boolean", hint: "true / false" },
  { value: "string", label: "String", hint: "Text value" },
  { value: "number", label: "Number", hint: "Numeric value" },
  { value: "json", label: "JSON", hint: "Structured value" },
];

const bestPractices = [
  "Use stable, descriptive keys",
  "Add a clear description for reviewers",
  "Avoid temporary flags in production",
  "Plan for a cleanup date",
] as const;

const suggestedTags = ["checkout", "frontend", "payments", "internal"];

type CreateFlagField = "key" | "name" | "description" | "type" | "tags";

type CreateFlagErrors = FieldErrors<CreateFlagField>;

export function CreateFlagForm({ projectKey }: { projectKey: string }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<FlagType>("boolean");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [editedKey, setEditedKey] = useState(false);
  const [errors, setErrors] = useState<CreateFlagErrors>({});
  const [pending, setPending] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  function clearError(field: keyof CreateFlagErrors) {
    setErrors((previous) => ({ ...previous, form: undefined, [field]: undefined }));
  }

  function handleNameChange(value: string) {
    setName(value);
    // Keep the key in step with the name until the user takes it over.
    if (!editedKey) setKey(toWorkspaceSlug(value));
    clearError("name");
  }

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (!tag || tags.includes(tag)) return;
    setTags((previous) => [...previous, tag]);
    setTagDraft("");
  }

  function input(): CreateFlagInput {
    return {
      key: key.trim(),
      name: name.trim(),
      description: description.trim() || null,
      type,
      tags,
    };
  }

  function validate(): CreateFlagErrors | null {
    const result = createFlagSchema.safeParse(input());

    return result.success ? null : toFieldErrors<CreateFlagField>(result.error);
  }

  function goToStep(next: number) {
    const nextErrors = validate();
    setErrors(nextErrors ?? {});

    // Only the first step gates progress; Review is the confirmation.
    if (next > 0 && (nextErrors?.name || nextErrors?.key)) return;
    setStep(next);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const nextErrors = validate();
    if (nextErrors) {
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
      const created = await flagsApi.create(projectKey, input(), {
        signal: controller.signal,
      });
      setCreatedKey(created.key);
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;

      if (error instanceof ApiError) {
        if (error.status === 409) {
          setErrors({ key: error.message });
          setStep(0);
          return;
        }

        setErrors({ form: error.message });
        return;
      }

      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setPending(false);
    }
  }

  function reset() {
    setCreatedKey(null);
    setStep(0);
    setName("");
    setKey("");
    setDescription("");
    setTags([]);
    setType("boolean");
    setEditedKey(false);
  }

  if (createdKey) {
    return (
      <>
        <CreateFlagHeader steps={[...steps]} currentStep={2} />
        <div className="bg-card rounded-lg border p-6">
          <span className="bg-ok-ink/10 text-ok-ink flex size-9 items-center justify-center rounded-lg">
            <CheckIcon aria-hidden="true" className="size-4.5" />
          </span>
          <h2 className="mt-3 text-base font-semibold tracking-tight">
            {createdKey} created
          </h2>
          <p className="text-muted-foreground mt-1 max-w-md text-[13px]">
            The flag was created switched off in every environment. Configure
            targeting per environment, then turn it on when you are ready.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <Button asChild size="sm">
              <Link href={`/flags/${createdKey}`}>Open flag</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={reset}>
              Create another
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/flags">Back to flags</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  const previewFlagKey = key.trim() || "flag-key";

  return (
    <form onSubmit={handleSubmit} noValidate>
      <CreateFlagHeader steps={[...steps]} currentStep={step} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <div className="space-y-4">
          {step === 0 ? (
            <>
              <section className="bg-card rounded-lg border p-4">
                <h2 className="text-[13px] font-medium">Flag details</h2>

                <div className="mt-4 space-y-4">
                  <Field
                    id="flag-name"
                    label="Flag name"
                    name="name"
                    placeholder="New checkout experience"
                    required
                    value={name}
                    error={errors.name}
                    onChange={(event) => handleNameChange(event.target.value)}
                  />

                  <div className="space-y-2">
                    <Field
                      id="flag-key"
                      label="Flag key"
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
                      {key.trim()
                        ? "Used to evaluate the flag. The key cannot be changed later."
                        : "Lower case and dashes only, e.g. checkout-v2."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="flag-description">Description</Label>
                    <Textarea
                      id="flag-description"
                      name="description"
                      rows={3}
                      maxLength={280}
                      placeholder="What this flag controls and when it can be removed."
                      value={description}
                      onChange={(event) => {
                        setDescription(event.target.value);
                        clearError("description");
                      }}
                    />
                    {errors.description ? (
                      <FieldError>{errors.description}</FieldError>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="bg-card rounded-lg border p-4">
                <h2 className="text-[13px] font-medium">Flag type</h2>
                <RadioGroup
                  value={type}
                  onValueChange={(value) => setType(value as FlagType)}
                  className="mt-3 grid gap-2 sm:grid-cols-2"
                >
                  {flagTypes.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`flag-type-${option.value}`}
                      className={cn(
                        "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 font-normal transition-colors",
                        type === option.value
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50",
                      )}
                    >
                      <RadioGroupItem
                        id={`flag-type-${option.value}`}
                        value={option.value}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="block text-[12px] font-medium">
                          {option.label}
                        </span>
                        <span className="text-muted-foreground block text-[11px]">
                          {option.hint}
                        </span>
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </section>

              <section className="bg-card rounded-lg border p-4">
                <h2 className="text-[13px] font-medium">Tags</h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-muted inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px]"
                    >
                      {tag}
                      <button
                        type="button"
                        aria-label={`Remove tag ${tag}`}
                        onClick={() =>
                          setTags((previous) =>
                            previous.filter((item) => item !== tag),
                          )
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <XIcon aria-hidden="true" className="size-3" />
                      </button>
                    </span>
                  ))}

                  <div className="flex items-center gap-1.5">
                    <TagIcon
                      aria-hidden="true"
                      className="text-muted-foreground size-3.5"
                    />
                    <Input
                      value={tagDraft}
                      onChange={(event) => setTagDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addTag(tagDraft);
                        }
                      }}
                      aria-label="Add a tag"
                      placeholder="Add Tag"
                      className="h-7 w-28 text-[11px]"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {suggestedTags
                    .filter((tag) => !tags.includes(tag))
                    .map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addTag(tag)}
                        className="text-muted-foreground hover:text-foreground border-border rounded-md border border-dashed px-2 py-0.5 text-[10px] transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                </div>

                {errors.tags ? <FieldError>{errors.tags}</FieldError> : null}
              </section>
            </>
          ) : null}

          {step === 1 ? (
            <section className="bg-card rounded-lg border p-4">
              <h2 className="text-[13px] font-medium">Targeting</h2>
              <p className="text-muted-foreground mt-1 text-[12px]">
                The flag is created switched off. Targeting rules are configured
                per environment once it exists.
              </p>
              <div className="bg-muted/50 mt-4 rounded-lg border border-dashed p-4">
                <p className="text-[12px] font-medium">
                  No targeting rules yet
                </p>
                <p className="text-muted-foreground mt-1 text-[11px]">
                  After creating the flag, open its Targeting tab to serve
                  variations by attribute, segment or percentage rollout.
                </p>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="bg-card rounded-lg border p-4">
              <h2 className="text-[13px] font-medium">Review</h2>
              <p className="text-muted-foreground mt-1 text-[12px]">
                Check the configuration before creating the flag.
              </p>

              <dl className="mt-4 divide-y text-[12px]">
                {[
                  ["Name", name || "—"],
                  ["Key", key || "—"],
                  ["Type", flagTypes.find((item) => item.value === type)?.label ?? type],
                  ["Tags", tags.length > 0 ? tags.join(", ") : "None"],
                  ["Description", description || "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-4 py-2"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="max-w-[60%] text-right break-words">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4">
                <p className="text-muted-foreground mb-2 text-[11px]">
                  The flag will be created switched off in every environment.
                </p>
                <SdkPreview
                  title="Config to be created"
                  lines={JSON.stringify(input(), null, 2).split("\n")}
                />
              </div>
            </section>
          ) : null}

          {errors.form ? <FieldError>{errors.form}</FieldError> : null}

          <div className="flex items-center justify-between gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/flags">Cancel</Link>
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
                  {pending ? "Creating…" : "Create Flag"}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <SdkPreview
            lines={sdkSnippet({
              flagKey: previewFlagKey,
              fallback: "false",
            })}
          />

          <section className="bg-card rounded-lg border p-4">
            <h2 className="text-[13px] font-medium">Best practices</h2>
            <ul className="mt-3 space-y-2">
              {bestPractices.map((practice) => (
                <li
                  key={practice}
                  className="text-muted-foreground flex items-start gap-2 text-[12px] leading-5"
                >
                  <CheckIcon
                    aria-hidden="true"
                    className="text-ok-ink mt-0.5 size-3.5 shrink-0"
                  />
                  {practice}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </form>
  );
}
