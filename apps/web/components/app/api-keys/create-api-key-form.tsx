"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRoundIcon, LoaderCircleIcon } from "lucide-react";
import {
  createApiKeySchema,
  toFieldErrors,
  type ApiKeyScope,
  type CreateApiKeyInput,
  type EnvironmentSummary,
  type FieldErrors,
} from "@dariise/contracts";
import {
  KeyShownOnceCard,
  SecurityBestPracticesCard,
} from "@/components/app/api-keys/api-key-notes";
import { useCreatedApiKey } from "@/components/app/api-keys/api-keys-provider";
import { API_KEY_SCOPE_OPTIONS } from "@/components/app/api-keys/api-key-scopes";
import { Field, FieldError } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError, apiKeys } from "@/lib/api";

type CreateApiKeyField = "name" | "environmentKey" | "scopes" | "expiresInDays";

type CreateApiKeyErrors = FieldErrors<CreateApiKeyField>;

type ApiKeyExpiration = "never" | "30d" | "90d" | "1y";

const expirations: Array<{
  value: ApiKeyExpiration;
  label: string;
  days: number | null;
}> = [
  { value: "never", label: "Never", days: null },
  { value: "30d", label: "30 days", days: 30 },
  { value: "90d", label: "90 days", days: 90 },
  { value: "1y", label: "1 year", days: 365 },
];

/** DOM id for a permission row, e.g. `api-key-scope-flags-read`. */
function scopeFieldId(scope: ApiKeyScope): string {
  return `api-key-scope-${scope.replace(":", "-")}`;
}

export function CreateApiKeyForm({
  projectKey,
  environments,
}: {
  projectKey: string;
  environments: EnvironmentSummary[];
}) {
  const router = useRouter();
  const { setCreated } = useCreatedApiKey();
  const defaultEnvironment =
    environments.find((environment) => environment.isDefault)?.key ??
    environments[0]?.key ??
    "";

  const [name, setName] = useState("");
  const [environmentKey, setEnvironmentKey] = useState(defaultEnvironment);
  const [scopes, setScopes] = useState<ApiKeyScope[]>(["flags:read"]);
  const [expiration, setExpiration] = useState<ApiKeyExpiration>("never");
  const [errors, setErrors] = useState<CreateApiKeyErrors>({});
  const [pending, setPending] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  function clearError(field: keyof CreateApiKeyErrors) {
    setErrors((previous) => ({
      ...previous,
      form: undefined,
      [field]: undefined,
    }));
  }

  function toggleScope(scope: ApiKeyScope, checked: boolean) {
    setScopes((previous) =>
      checked
        ? [...previous, scope]
        : previous.filter((item) => item !== scope),
    );
    clearError("scopes");
  }

  function input(): CreateApiKeyInput {
    return {
      name: name.trim(),
      environmentKey: environmentKey === "" ? null : environmentKey,
      scopes,
      expiresInDays:
        expirations.find((option) => option.value === expiration)?.days ??
        null,
    };
  }

  function validate(): CreateApiKeyErrors | null {
    const result = createApiKeySchema.safeParse(input());

    return result.success
      ? null
      : toFieldErrors<CreateApiKeyField>(result.error);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const nextErrors = validate();
    if (nextErrors) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setPending(true);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const created = await apiKeys.create(projectKey, input(), {
        signal: controller.signal,
      });
      setCreated(created);
      router.push("/api-keys");
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;

      setErrors({
        form:
          error instanceof ApiError
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)]">
        <div className="space-y-4">
          <section className="bg-card rounded-lg border p-4">
            <h2 className="text-[13px] font-medium">Key details</h2>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Field
                  id="api-key-name"
                  label="Name"
                  name="name"
                  placeholder="Production SDK"
                  required
                  maxLength={80}
                  value={name}
                  error={errors.name}
                  onChange={(event) => {
                    setName(event.target.value);
                    clearError("name");
                  }}
                />
                <p className="text-muted-foreground text-[11px]">
                  Shown in the dashboard and audit log.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key-environment">Environment</Label>
                <Select
                  value={environmentKey}
                  onValueChange={setEnvironmentKey}
                  disabled={environments.length === 0}
                >
                  <SelectTrigger
                    id="api-key-environment"
                    className="h-8 w-full text-[12px]"
                  >
                    <SelectValue placeholder="No environment" />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map((environment) => (
                      <SelectItem key={environment.key} value={environment.key}>
                        {environment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-[11px]">
                  Keys are scoped to a single environment.
                </p>
              </div>

              <div className="space-y-2">
                <Label asChild>
                  <p id="api-key-permissions-label">Permissions</p>
                </Label>
                <ul
                  aria-labelledby="api-key-permissions-label"
                  className="divide-y"
                >
                  {API_KEY_SCOPE_OPTIONS.map((scope) => (
                    <li key={scope.value}>
                      <Label
                        htmlFor={scopeFieldId(scope.value)}
                        className="flex cursor-pointer items-start gap-2.5 py-3 font-normal"
                      >
                        <Checkbox
                          id={scopeFieldId(scope.value)}
                          checked={scopes.includes(scope.value)}
                          onCheckedChange={(checked) =>
                            toggleScope(scope.value, checked === true)
                          }
                          className="mt-0.5"
                        />
                        <span className="min-w-0">
                          <span className="block text-[12px] font-medium">
                            {scope.label}
                          </span>
                          <span className="text-muted-foreground block text-[11px] leading-4">
                            {scope.description}
                          </span>
                        </span>
                      </Label>
                    </li>
                  ))}
                </ul>
                {errors.scopes ? <FieldError>{errors.scopes}</FieldError> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key-expiration">Expiration</Label>
                <Select
                  value={expiration}
                  onValueChange={(value) =>
                    setExpiration(value as ApiKeyExpiration)
                  }
                >
                  <SelectTrigger
                    id="api-key-expiration"
                    className="h-8 w-full text-[12px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expirations.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-[11px]">
                  Rotate keys regularly for production workloads.
                </p>
              </div>
            </div>
          </section>

          {errors.form ? <FieldError>{errors.form}</FieldError> : null}

          <div className="flex items-center justify-between gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/api-keys">Cancel</Link>
            </Button>

            <Button
              type="submit"
              size="sm"
              className="gap-1.5"
              disabled={pending}
            >
              {pending ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <KeyRoundIcon aria-hidden="true" className="size-3.5" />
              )}
              {pending ? "Creating…" : "Create key"}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <KeyShownOnceCard />
          <SecurityBestPracticesCard />
        </div>
      </div>
    </form>
  );
}
