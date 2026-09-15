"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2Icon,
  InfoIcon,
  LoaderCircleIcon,
  PlusIcon,
  SaveIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  FlagDetailView,
  TargetingCondition,
  TargetingOperator,
  TargetingRule,
} from "@/lib/flag-detail-data";
import { publishFlagChanges } from "@/lib/flag-stub";

const operators: TargetingOperator[] = [
  "is one of",
  "is not one of",
  "equals",
  "contains",
  "matches",
];

/**
 * Targeting tab.
 *
 * Rule edits are local to this screen: the API is not wired up, so publishing
 * acknowledges locally and nothing survives a reload.
 */
export function FlagTargeting({ flag }: { flag: FlagDetailView }) {
  const [rules, setRules] = useState<TargetingRule[]>(flag.rules);
  const [targets, setTargets] = useState(flag.individualTargets);
  const [serveDefault, setServeDefault] = useState(flag.defaultVariation);
  const [pending, setPending] = useState(false);
  const [published, setPublished] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const environmentLabel =
    flag.environment.charAt(0).toUpperCase() + flag.environment.slice(1);

  function updateCondition(
    ruleId: string,
    conditionId: string,
    patch: Partial<TargetingCondition>,
  ) {
    setRules((previous) =>
      previous.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              conditions: rule.conditions.map((condition) =>
                condition.id === conditionId
                  ? { ...condition, ...patch }
                  : condition,
              ),
            }
          : rule,
      ),
    );
  }

  function updateRule(ruleId: string, patch: Partial<TargetingRule>) {
    setRules((previous) =>
      previous.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)),
    );
  }

  function addRule() {
    const stamp = rules.length + 1;
    setRules((previous) => [
      ...previous,
      {
        id: `rule-${stamp}`,
        name: `Rule ${stamp}`,
        conditions: [
          {
            id: `cond-${stamp}`,
            attribute: "user.id",
            operator: "is one of",
            values: [],
          },
        ],
        serve: flag.defaultVariation,
      },
    ]);
  }

  async function handlePublish() {
    if (pending) return;
    setPending(true);
    setPublished(false);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await publishFlagChanges(
        {
          key: flag.key,
          enabled: flag.enabled,
          defaultVariation: serveDefault,
          rolloutPercentage: flag.rolloutPercentage,
          rules,
        },
        controller.signal,
      );
      setPublished(true);
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") setPublished(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)]">
      <div className="space-y-4">
        <section className="bg-card rounded-lg border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-medium">Targeting Rules</h2>
              <p className="text-muted-foreground mt-1 text-[11px]">
                Rules are evaluated top to bottom. The first match wins.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Auto segment — coming soon"
              className="gap-1.5 text-[11px]"
            >
              <SparklesIcon aria-hidden="true" className="size-3.5" />
              Auto segment
            </Button>
          </div>

          {rules.length === 0 ? (
            <p className="text-muted-foreground mt-4 rounded-lg border border-dashed p-4 text-[12px]">
              No targeting rules. Every user receives the default variation.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {rules.map((rule) => (
                <li key={rule.id} className="bg-muted/30 rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] font-medium">
                      {rule.name}
                      <span className="text-muted-foreground ml-1.5 font-normal">
                        ALL conditions
                      </span>
                    </p>
                    <div className="flex items-center gap-2">
                      {rule.rollout !== undefined ? (
                        <span className="bg-primary/10 text-primary rounded-md px-1.5 py-0.5 text-[10px]">
                          {rule.rollout}% rollout
                        </span>
                      ) : null}
                      <span className="text-muted-foreground text-[10px]">
                        serve
                      </span>
                      <Select
                        value={rule.serve}
                        onValueChange={(value) =>
                          updateRule(rule.id, { serve: value })
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          aria-label={`Variation served by ${rule.name}`}
                          className="text-[11px]"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {flag.variations.map((variation) => (
                            <SelectItem
                              key={variation.name}
                              value={variation.name}
                            >
                              {variation.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <ul className="mt-2.5 space-y-2">
                    {rule.conditions.map((condition, index) => (
                      <li
                        key={condition.id}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <span className="text-muted-foreground w-7 text-[10px] uppercase">
                          {index === 0 ? "if" : "and"}
                        </span>
                        <span className="bg-card rounded-md border px-2 py-1 font-mono text-[11px]">
                          {condition.attribute}
                        </span>
                        <Select
                          value={condition.operator}
                          onValueChange={(value) =>
                            updateCondition(rule.id, condition.id, {
                              operator: value as TargetingOperator,
                            })
                          }
                        >
                          <SelectTrigger
                            size="sm"
                            aria-label={`Operator for ${condition.attribute}`}
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
                        <span className="bg-card min-w-24 rounded-md border px-2 py-1 font-mono text-[11px]">
                          {condition.values.length > 0
                            ? condition.values.join(", ")
                            : "any"}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-2.5 flex items-center justify-between">
                    <span
                      title="Add condition — coming soon"
                      aria-disabled="true"
                      className="text-muted-foreground/60 text-[10px]"
                    >
                      + Add condition
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setRules((previous) =>
                          previous.filter((item) => item.id !== rule.id),
                        )
                      }
                      className="text-muted-foreground hover:text-danger-ink inline-flex items-center gap-1 text-[10px] underline-offset-2 hover:underline"
                    >
                      <XIcon aria-hidden="true" className="size-3" />
                      Remove rule
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={addRule}
            className="text-muted-foreground hover:text-foreground mt-3 inline-flex items-center gap-1.5 text-[11px] underline-offset-2 hover:underline"
          >
            <PlusIcon aria-hidden="true" className="size-3.5" />
            Add targeting rule
          </button>
        </section>

        <section className="bg-card rounded-lg border p-4">
          <h2 className="text-[13px] font-medium">Individual Targeting</h2>
          <p className="text-muted-foreground mt-1 text-[11px]">
            Override the variation for specific users.
          </p>

          {targets.length === 0 ? (
            <p className="text-muted-foreground mt-4 rounded-lg border border-dashed p-4 text-[12px]">
              No individual targets.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {targets.map((target) => (
                <li
                  key={target.userId}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <span className="font-mono text-[11px]">{target.userId}</span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={target.serve}
                      onValueChange={(value) =>
                        setTargets((previous) =>
                          previous.map((item) =>
                            item.userId === target.userId
                              ? { ...item, serve: value }
                              : item,
                          ),
                        )
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        aria-label={`Variation for ${target.userId}`}
                        className="text-[11px]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {flag.variations.map((variation) => (
                          <SelectItem
                            key={variation.name}
                            value={variation.name}
                          >
                            {variation.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() =>
                        setTargets((previous) =>
                          previous.filter(
                            (item) => item.userId !== target.userId,
                          ),
                        )
                      }
                      className="text-muted-foreground hover:text-danger-ink text-[10px] underline-offset-2 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Button
            variant="outline"
            size="sm"
            disabled
            title="Add user — coming soon"
            className="mt-3 gap-1.5 text-[11px]"
          >
            <PlusIcon aria-hidden="true" className="size-3.5" />
            Add user
          </Button>
        </section>
      </div>

      <div className="space-y-4">
        <section className="bg-card rounded-lg border p-4">
          <h2 className="text-[13px] font-medium">Default Rule</h2>
          <p className="text-muted-foreground mt-1 text-[11px]">
            Served when no targeting rules match.
          </p>

          <div className="mt-3 space-y-2">
            <Label htmlFor="default-serving">Serve variation</Label>
            <Select value={serveDefault} onValueChange={setServeDefault}>
              <SelectTrigger
                id="default-serving"
                className="h-8 w-full text-[12px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {flag.variations.map((variation) => (
                  <SelectItem key={variation.name} value={variation.name}>
                    {variation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-muted-foreground mt-3 rounded-md border px-3 py-2 text-[11px]">
            Serving{" "}
            <span className="text-foreground font-mono">{serveDefault}</span> to
            everyone in {environmentLabel} who matches no rule above.
          </p>
        </section>

        <section className="bg-card rounded-lg border p-4">
          <h2 className="text-[13px] font-medium">Publish changes</h2>
          <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-[11px]">
            <InfoIcon aria-hidden="true" className="size-3.5" />
            Last published {flag.updatedLabel}
          </div>

          <Button
            size="sm"
            className="mt-3 w-full gap-1.5 text-[11px]"
            disabled={pending}
            onClick={handlePublish}
          >
            {pending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <SaveIcon aria-hidden="true" className="size-3.5" />
            )}
            {pending ? "Publishing…" : "Save & Publish"}
          </Button>

          {published ? (
            <p className="text-ok-ink mt-2 inline-flex items-center gap-1.5 text-[11px]">
              <CheckCircle2Icon aria-hidden="true" className="size-3.5" />
              Published just now — nothing is persisted
            </p>
          ) : null}

          <p className="text-muted-foreground mt-3 border-t pt-3 text-[10px]">
            {environmentLabel} · {rules.length} rule
            {rules.length === 1 ? "" : "s"} · {targets.length} individual target
            {targets.length === 1 ? "" : "s"}
          </p>
        </section>
      </div>
    </div>
  );
}
