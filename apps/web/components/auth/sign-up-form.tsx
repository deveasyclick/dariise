"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { LoaderCircleIcon } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { AccessTabs } from "@/components/auth/access-tabs";
import { GitHubIcon, GoogleIcon } from "@/components/auth/brand-icons";
import {
  Field,
  FieldError,
  FieldRow,
  PasswordField,
} from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { signInWithProvider, signUp, type OAuthProvider } from "@/lib/auth-stub";
import { isEmail, isRequired } from "@/lib/validation";

type Action = OAuthProvider | "credentials";

interface SignUpErrors {
  form?: string;
  name?: string;
  email?: string;
  password?: string;
  terms?: string;
}

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [pending, setPending] = useState<Action | null>(null);
  const [created, setCreated] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  function clearError(field: keyof SignUpErrors) {
    setErrors((previous) => ({ ...previous, form: undefined, [field]: undefined }));
  }

  async function run(
    action: Action,
    task: (signal: AbortSignal) => Promise<void>,
  ) {
    if (pending) return;
    setPending(action);
    setErrors((previous) => ({ ...previous, form: undefined }));
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await task(controller.signal);
      setCreated(true);
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      setErrors((previous) => ({
        ...previous,
        form: "Something went wrong. Please try again.",
      }));
    } finally {
      setPending(null);
    }
  }

  function handleProvider(provider: OAuthProvider) {
    return run(provider, (signal) => signInWithProvider(provider, signal));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: SignUpErrors = {
      name: isRequired(name, "Name") ?? undefined,
      email: isRequired(email, "Email") ?? isEmail(email) ?? undefined,
      password:
        isRequired(password, "Password") ??
        (password.length < 8
          ? "Password must be at least 8 characters."
          : undefined),
      terms: acceptedTerms
        ? undefined
        : "Please accept the Terms and Privacy Policy to continue.",
    };

    if (
      nextErrors.name ||
      nextErrors.email ||
      nextErrors.password ||
      nextErrors.terms
    ) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    void run("credentials", (signal) =>
      signUp({ name: name.trim(), email: email.trim(), password }, signal),
    );
  }

  if (created) {
    return (
      <AuthCard
        title="Account created"
        description="Your account is ready. Creating a workspace is the next step."
      >
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/create-workspace">Create a workspace</Link>
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
      title="Create your account"
      description="Set up your Dariise account. You can create a workspace next."
      backLink={<AccessTabs current="access" />}
    >
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={pending !== null}
          onClick={() => handleProvider("github")}
        >
          {pending === "github" ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <GitHubIcon className="size-4" />
          )}
          Continue with GitHub
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={pending !== null}
          onClick={() => handleProvider("google")}
        >
          {pending === "google" ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <GoogleIcon className="size-4" />
          )}
          Continue with Google
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-xs">OR</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          id="sign-up-name"
          label="Name"
          name="name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          required
          value={name}
          error={errors.name}
          onChange={(event) => {
            setName(event.target.value);
            clearError("name");
          }}
        />

        <Field
          id="sign-up-email"
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          value={email}
          error={errors.email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearError("email");
          }}
        />

        <PasswordField
          id="sign-up-password"
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          value={password}
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            clearError("password");
          }}
        />

        <div className="space-y-2">
          <FieldRow
            htmlFor="sign-up-terms"
            control={
              <Checkbox
                id="sign-up-terms"
                name="terms"
                aria-invalid={errors.terms ? true : undefined}
                aria-describedby={
                  errors.terms ? "sign-up-terms-error" : undefined
                }
                checked={acceptedTerms}
                onCheckedChange={(checked) => {
                  setAcceptedTerms(checked === true);
                  clearError("terms");
                }}
              />
            }
          >
            I agree to the Terms of Service and Privacy Policy.
          </FieldRow>
          {errors.terms ? (
            <FieldError id="sign-up-terms-error">{errors.terms}</FieldError>
          ) : null}
        </div>

        {errors.form ? <FieldError>{errors.form}</FieldError> : null}

        <Button type="submit" className="w-full" disabled={pending !== null}>
          {pending === "credentials" ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : null}
          {pending === "credentials" ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link href="/" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
