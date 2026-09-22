"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckIcon,
  LoaderCircleIcon,
  PlusIcon,
  RocketIcon,
  XIcon,
} from "lucide-react";
import { CreateSegmentHeader } from "@/components/app/segments/segment-headers";
import { SdkPreview } from "@/components/app/flags/sdk-preview";
import { Field, FieldError } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  formatRuleSummary,
  matchingUsers,
  type SegmentOperator,
  type SegmentRule,
} from "@/lib/segment-data";
import { createSegment as createSegmentRequest } from "@/lib/segment-stub";
import { isRequired, isValidWorkspaceSlug, toWorkspaceSlug } from "@/lib/validation";

const steps = ["Details", "Rules", "Review"] as const;

const operators: SegmentOperator[] = [
  "is",
  "is not",
  "is one of",
  "ends with",
  "starts with",
  "greater than",
  "less than",
];

const attributeOptions = [
  "user.beta",
  "user.email",
  "user.plan",
  "region",
  "sessions",
];

const tips = [
  "Segments update automatically as attributes change.",
  "Reference a segment in any flag's targeting rules.",
  "Combine conditions with AND (+) to narrow the audience.",
] as const;

interface CreateSegmentErrors {
  form?: string;
  name?: string;
  key?: string;
  rules?: string;
}

function newRule(index: number): SegmentRule {
  return {
    id: `r-${index}`,
    attribute: "user.beta",
    operator: "is",
    values: [""],
  };
}

export function CreateSegmentForm({ existingKeys }: { existingKeys: string[] }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState<SegmentRule[]>([newRule(1)]);
  const [editedKey, setEditedKey] = useState(false);
  const [errors, setErrors] = useState<CreateSegmentErrors>({});
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const reach = useMemo(() => matchingUsers(rules).length, [rules]);

  function clearError(field: keyof CreateSegmentErrors) {
    setErrors((previous) => ({ ...previous, form: undefined, [field]: undefined }));
  }

  function handleNameChange(value: string) {
    setName(value);
    // Keep the key in step with the name until the user takes it over.
    if (!editedKey) setKey(toWorkspaceSlug(value));
    clearError("name");
  }

  function updateRule(id: string, patch: Partial<SegmentRule>) {
    setRules((previous) =>
      previous.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    );
    clearError("rules");
  }

  function addRule() {
    setRules((previous) => [...previous, newRule(previous.length + 1)]);
  }

  function removeRule(id: string) {
    setRules((previous) => previous.filter((rule) => rule.id !== id));
  }

  function validate(): CreateSegmentErrors {
    const next: CreateSegmentErrors = {
      name: isRequired(name, "Segment name") ?? undefined,
      key: isValidWorkspaceSlug(key) ?? undefined,
    };

    if (!next.key && existingKeys.includes(key.trim())) {
      next.key = "A segment with this key already exists.";
    }

    const incomplete = rules.some(
      (rule) => rule.values.every((value) => !value.trim()),
    );
    if (incomplete) {
      next.rules = "Every rule needs a value.";
    }

    return next;
  }

  function goToStep(next: number) {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (next > 0 && (nextErrors.name || nextErrors.key)) return;
    if (next > 1 && nextErrors.rules) return;
    setStep(next);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const nextErrors = validate();
    if (nextErrors.name || nextErrors.key || nextErrors.rules) {
      setErrors(nextErrors);
      setStep(nextErrors.name || nextErrors.key ? 0 : 1);
      return;
    }

    setErrors({});
    setPending(true);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await createSegmentRequest(
        {
          name: name.trim(),
          key: key.trim(),
          description: description.trim(),
          rules,
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
      <>
        <CreateSegmentHeader steps={[...steps]} currentStep={2} />
        <div className="bg-card rounded-lg border p-6">
          <span className="bg-ok-ink/10 text-ok-ink flex size-9 items-center justify-center rounded-lg">
            <CheckIcon aria-hidden="true" className="size-4.5" />
          </span>
          <h2 className="mt-3 text-base font-semibold tracking-tight">
            {name || key} created
          </h2>
          <p className="text-muted-foreground mt-1 max-w-md text-[13px]">
            The segment exists in this preview only — the API is not wired up
            yet, so nothing was saved and no flag can target it.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/segments">Back to segments</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCreated(false);
                setStep(0);
                setName("");
                setKey("");
                setDescription("");
                setRules([newRule(1)]);
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

  return (
    <form onSubmit={handleSubmit} noValidate>
      <CreateSegmentHeader steps={[...steps]} currentStep={step} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)]">
        <div className="space-y-4">
          {step === 0 ? (
            <section className="bg-card rounded-lg border p-4">
              <h2 className="text-[13px] font-medium">Segment details</h2>

              <div className="mt-4 space-y-4">
                <Field
                  id="segment-name"
                  label="Name"
                  name="name"
                  placeholder="Beta Users"
                  required
                  value={name}
                  error={errors.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                />

                <div className="space-y-2">
                  <Field
                    id="segment-key"
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
                    {key.trim()
                      ? "Used to reference this segment from a flag's targeting rules."
                      : "Lower case and dashes only, e.g. beta-users."}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="segment-description">Description</Label>
                  <Textarea
                    id="segment-description"
                    name="description"
                    rows={3}
                    placeholder="Who this segment is for and why it exists."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="bg-card rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[13px] font-medium">Rules</h2>
                  <p className="text-muted-foreground mt-1 text-[11px]">
                    A user belongs to the segment when every rule matches.
                  </p>
                </div>
                <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-[10px]">
                  AND
                </span>
              </div>

              <ul className="mt-4 space-y-2">
                {rules.map((rule, index) => (
                  <li
                    key={rule.id}
                    className="bg-muted/30 flex flex-wrap items-center gap-2 rounded-lg border p-2.5"
                  >
                    <span className="text-muted-foreground w-12 text-[10px] uppercase">
                      {index === 0 ? "if" : "and"}
                    </span>

                    <Select
                      value={rule.attribute}
                      onValueChange={(value) =>
                        updateRule(rule.id, { attribute: value })
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        aria-label={`Attribute for rule ${index + 1}`}
                        className="text-[11px]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {attributeOptions.map((attribute) => (
                          <SelectItem key={attribute} value={attribute}>
                            {attribute}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={rule.operator}
                      onValueChange={(value) =>
                        updateRule(rule.id, {
                          operator: value as SegmentOperator,
                        })
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        aria-label={`Operator for rule ${index + 1}`}
                        className="text-[11px]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((operator) => (
                          <SelectItem key={operator} value={operator}>
                            {operator}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <input
                      value={rule.values.join(", ")}
                      onChange={(event) =>
                        updateRule(rule.id, {
                          values: event.target.value.split(","),
                        })
                      }
                      aria-label={`Value for rule ${index + 1}`}
                      placeholder="true"
                      className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-7 min-w-28 flex-1 rounded-lg border bg-transparent px-2 font-mono text-[11px] outline-none focus-visible:ring-3"
                    />

                    <button
                      type="button"
                      onClick={() => removeRule(rule.id)}
                      aria-label={`Remove rule ${index + 1}`}
                      className="text-muted-foreground hover:text-danger-ink rounded p-1 transition-colors"
                    >
                      <XIcon aria-hidden="true" className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={addRule}
                className="text-muted-foreground hover:text-foreground mt-3 inline-flex items-center gap-1.5 text-[11px] underline-offset-2 hover:underline"
              >
                <PlusIcon aria-hidden="true" className="size-3.5" />
                Add condition
              </button>

              {errors.rules ? (
                <div className="mt-3">
                  <FieldError>{errors.rules}</FieldError>
                </div>
              ) : null}
            </section>
          ) : null}

          {step === 2 ? (
            <section className="bg-card rounded-lg border p-4">
              <h2 className="text-[13px] font-medium">Review</h2>
              <p className="text-muted-foreground mt-1 text-[12px]">
                Check the segment before creating it.
              </p>

              <dl className="mt-4 divide-y text-[12px]">
                {[
                  ["Name", name || "—"],
                  ["Key", key || "—"],
                  ["Rules", formatRuleSummary(rules)],
                  ["Description", description || "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-4 py-2"
                  >
                    <dt className="text-muted-foreground shrink-0">{label}</dt>
                    <dd className="max-w-[65%] text-right break-words">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4">
                <SdkPreview
                  title="Segment to be created"
                  lines={JSON.stringify(
                    {
                      key: key.trim() || "segment-key",
                      name: name.trim(),
                      type: "dynamic",
                      rules: rules.map((rule) => ({
                        attribute: rule.attribute,
                        operator: rule.operator,
                        values: rule.values.map((value) => value.trim()),
                      })),
                    },
                    null,
                    2,
                  ).split("\n")}
                />
              </div>
            </section>
          ) : null}

          {errors.form ? <FieldError>{errors.form}</FieldError> : null}

          <div className="flex items-center justify-between gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/segments">Cancel</Link>
            </Button>

            <div className="flex items-center gap-2">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(step - 1)}
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
                  {pending ? "Creating…" : "Create Segment"}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <section className="bg-card rounded-lg border p-4">
            <h2 className="text-[13px] font-medium">Estimated reach</h2>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {reach.toLocaleString("en-GB")}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11px]">
              {reach === 1 ? "user matches" : "users match"} these rules
            </p>
            <p className="text-muted-foreground mt-3 border-t pt-3 text-[10px]">
              Based on the sample audience. Real reach is computed by the API
              once it exists.
            </p>
          </section>

          <section className="bg-card rounded-lg border p-4">
            <h2 className="text-[13px] font-medium">Tips</h2>
            <ul className="mt-3 space-y-2">
              {tips.map((tip) => (
                <li
                  key={tip}
                  className="text-muted-foreground flex items-start gap-2 text-[12px] leading-5"
                >
                  <CheckIcon
                    aria-hidden="true"
                    className="text-ok-ink mt-0.5 size-3.5 shrink-0"
                  />
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </form>
  );
}
