"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  LoaderCircleIcon,
  RocketIcon,
  TagIcon,
  XIcon,
} from "lucide-react";
import {
  createFlagSchema,
  defaultVariations,
  toFieldErrors,
  type CreateFlagInput,
  type FieldErrors,
  type FlagType,
  type FlagValuesInput,
} from "@dariise/contracts";
import { cn } from "cn";
import { CreateFlagHeader } from "@/components/app/flags/flag-headers";
import { VariationValueInput } from "@/components/app/flags/variation-value-input";
import { SdkPreview, sdkSnippet } from "@/components/app/flags/sdk-preview";
import { Field, FieldError } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, flags as flagsApi } from "@/lib/api";
import { toWorkspaceSlug } from "@/lib/validation";

const steps = ["Details", "Preview"] as const;

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

type CreateFlagField =
  | "key"
  | "name"
  | "description"
  | "type"
  | "tags"
  | "values";

type CreateFlagErrors = FieldErrors<CreateFlagField>;

/**
 * One labelled line of the create preview.
 *
 * The preview states each value rather than styling it into place: the name,
 * key and type read the same way as the tags and description beside them, so
 * nothing about what is about to be created has to be inferred from weight or
 * position.
 */
function PreviewRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-[60%] text-right break-words">{children}</dd>
    </div>
  );
}

export function CreateFlagForm({
  projectKey,
  environmentKey,
  environmentName,
}: {
  projectKey: string;
  /** The one environment the flag is created into. */
  environmentKey: string;
  environmentName: string;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<FlagType>("boolean");
  /**
   * What the flag serves in each environment it is created into.
   *
   * A non-boolean flag still has to answer when it is off, so both values are
   * decided here rather than left as the placeholders the API would otherwise
   * seed. Boolean flags never show these: their two values are the two booleans.
   */
  const [values, setValues] = useState<FlagValuesInput>(
    () => defaultVariations("boolean"),
  );
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [editedKey, setEditedKey] = useState(false);
  const [errors, setErrors] = useState<CreateFlagErrors>({});
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const controllerRef = useRef<AbortController | null>(null);

  function clearError(field: keyof CreateFlagErrors) {
    setErrors((previous) => ({ ...previous, form: undefined, [field]: undefined }));
  }

  function handleTypeChange(next: FlagType) {
    setType(next);
    // A pair typed for the previous type is meaningless in the next one.
    setValues(defaultVariations(next));
    clearError("values");
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
      environmentKey,
      key: key.trim(),
      name: name.trim(),
      description: description.trim() || null,
      type,
      tags,
      ...(type === "boolean" ? {} : { values }),
    };
  }

  function validate(): CreateFlagErrors | null {
    const result = createFlagSchema.safeParse(input());

    return result.success ? null : toFieldErrors<CreateFlagField>(result.error);
  }

  function goToStep(next: number) {
    const nextErrors = validate();
    setErrors(nextErrors ?? {});

    // Only the first step gates progress; Preview is the confirmation.
    if (next > 0 && (nextErrors?.name || nextErrors?.key)) return;
    setStep(next);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    /**
     * Creation only ever happens from the last step.
     *
     * The Continue and Create Flag buttons sit in the same place in the tree,
     * so without distinct keys React reuses one DOM node and rewrites its
     * `type` from `button` to `submit` mid-click — and the browser submits the
     * form the moment the attribute changes. The keys below stop that; this
     * guard means even an implicit submission (Enter in a field) cannot create
     * a flag from a step the user has not confirmed.
     */
    if (step !== steps.length - 1) return;

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

      /**
       * Straight to the flag, with no summary screen in between.
       *
       * A new flag is created switched off, so the only thing left to do is
       * configure it — and that happens on its own page. `replace` rather than
       * `push`, so going back cannot land on a filled-in create form and a
       * second submission.
       */
      router.replace(`/environments/${environmentKey}/flags/${created.key}`);
    } catch (error) {
      // Cleared here rather than in a `finally`: on success the route is about
      // to change, and re-enabling the button first would flash a form the user
      // has already submitted.
      setPending(false);

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
    }
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
                  onValueChange={(value) => handleTypeChange(value as FlagType)}
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

              {type === "boolean" ? null : (
                <section className="bg-card rounded-lg border p-4">
                  <h2 className="text-[13px] font-medium">Values</h2>
                  <p className="text-muted-foreground mt-1 text-[11px]">
                    A {type} flag still has to serve something while it is off,
                    so both values are set now. The flag starts with them, and
                    each can be changed on its configuration tab.
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="flag-value-on">When on</Label>
                      <VariationValueInput
                        id="flag-value-on"
                        type={type}
                        value={values.on}
                        onChange={(value) => {
                          setValues((previous) => ({ ...previous, on: value }));
                          clearError("values");
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="flag-value-off">When off</Label>
                      <VariationValueInput
                        id="flag-value-off"
                        type={type}
                        value={values.off}
                        onChange={(value) => {
                          setValues((previous) => ({ ...previous, off: value }));
                          clearError("values");
                        }}
                      />
                    </div>
                  </div>

                  {errors.values ? (
                    <FieldError>{errors.values}</FieldError>
                  ) : null}
                </section>
              )}

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
              <h2 className="text-[13px] font-medium">Preview</h2>
              <p className="text-muted-foreground mt-1 text-[11px]">
                The flag as it will exist once it is created.
              </p>

              <dl className="mt-3 divide-y text-[12px]">
                <PreviewRow label="Name">{name.trim() || "—"}</PreviewRow>
                <PreviewRow label="Key">
                  <span className="font-mono text-[11px]">
                    {key.trim() || "—"}
                  </span>
                </PreviewRow>
                <PreviewRow label="Type">
                  {flagTypes.find((item) => item.value === type)?.label ?? type}
                </PreviewRow>
                <PreviewRow label="Tags">
                  {tags.length > 0 ? tags.join(", ") : "None"}
                </PreviewRow>
                <PreviewRow label="Description">
                  {description.trim() || "—"}
                </PreviewRow>
              </dl>

              <h3 className="mt-5 text-[12px] font-medium">Variations</h3>
              <ul className="mt-2 divide-y text-[12px]">
                {(["on", "off"] as const).map((position) => (
                  <li
                    key={position}
                    className="flex items-center justify-between gap-4 py-2"
                  >
                    <span className="text-muted-foreground">
                      {position === "on" ? "On" : "Off"}
                    </span>
                    <span className="font-mono text-[11px]">
                      {JSON.stringify(values[position])}
                    </span>
                  </li>
                ))}
              </ul>

              <h3 className="mt-5 text-[12px] font-medium">Environment</h3>
              <p className="text-muted-foreground mt-1 text-[11px]">
                The flag is created switched off in this environment only. Other
                environments get it later, by promotion.
              </p>
              <ul className="mt-2 divide-y text-[12px]">
                <li className="flex items-center justify-between gap-4 py-2">
                  <span>{environmentName}</span>
                  <span className="text-muted-foreground text-[11px]">Off</span>
                </li>
              </ul>
            </section>
          ) : null}

          {errors.form ? <FieldError>{errors.form}</FieldError> : null}

          <div className="flex items-center justify-between gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/environments/${environmentKey}/flags`}>Cancel</Link>
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
                  // Distinct keys keep the two buttons as separate elements:
                  // sharing one DOM node lets the click that advances the step
                  // also flip the node to `type="submit"` and submit the form.
                  key="continue"
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => goToStep(step + 1)}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  key="create"
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
              // The value the SDK serves when it cannot reach Dariise: the off
              // variation, which for a typed flag is not `false`.
              fallback: JSON.stringify(values.off),
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
