"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { LoaderCircleIcon } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
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
import { signIn, signInWithProvider, type OAuthProvider } from "@/lib/auth-stub";
import { isEmail, isRequired } from "@/lib/validation";

type Action = OAuthProvider | "credentials";

interface SignInErrors {
  form?: string;
  email?: string;
  password?: string;
}

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<SignInErrors>({});
  const [pending, setPending] = useState<Action | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  function clearError(field: keyof SignInErrors) {
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
      setSignedIn(true);
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

    const nextErrors: SignInErrors = {
      email: isRequired(email, "Email") ?? isEmail(email) ?? undefined,
      password:
        isRequired(password, "Password") ??
        (password.length < 8
          ? "Password must be at least 8 characters."
          : undefined),
    };

    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    void run("credentials", (signal) =>
      signIn({ email: email.trim(), password, remember }, signal),
    );
  }

  if (signedIn) {
    return (
      <AuthCard
        title="You are signed in"
        description="Authentication is not wired up yet — this is a preview of the sign-in screen."
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
      title="Sign in to Dariise"
      description="Welcome back — the place to manage your feature flags."
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
          id="sign-in-email"
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
          id="sign-in-password"
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          value={password}
          error={errors.password}
          labelSuffix={
            <Link
              href="/forgot-password"
              className="text-primary text-xs font-medium hover:underline"
            >
              Forgot password?
            </Link>
          }
          onChange={(event) => {
            setPassword(event.target.value);
            clearError("password");
          }}
        />

        <FieldRow
          htmlFor="sign-in-remember"
          control={
            <Checkbox
              id="sign-in-remember"
              name="remember"
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked === true)}
            />
          }
        >
          Remember me
        </FieldRow>

        {errors.form ? <FieldError>{errors.form}</FieldError> : null}

        <Button type="submit" className="w-full" disabled={pending !== null}>
          {pending === "credentials" ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : null}
          {pending === "credentials" ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-primary font-medium hover:underline">
          Create one
        </Link>
      </p>
    </AuthCard>
  );
}
