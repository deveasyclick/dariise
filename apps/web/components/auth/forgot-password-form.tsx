"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, LoaderCircleIcon } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { Field, FieldError } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/lib/auth";
import { isEmail, isRequired } from "@/lib/validation";

interface ForgotPasswordErrors {
  form?: string;
  email?: string;
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const nextErrors: ForgotPasswordErrors = {
      email: isRequired(email, "Email") ?? isEmail(email) ?? undefined,
    };

    if (nextErrors.email) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setPending(true);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await requestPasswordReset(email.trim(), controller.signal);
      setSentTo(email.trim());
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <AuthCard
        title="Check your email"
        description={
          <>
            If an account exists for{" "}
            <span className="text-foreground font-medium">{sentTo}</span>, a
            password reset link is on its way. The link expires in 30 minutes.
          </>
        }
        backLink={<BackToSignIn />}
      >
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Return to sign in</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter the email you use for Dariise and we'll send you a reset link."
      backLink={<BackToSignIn />}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          id="forgot-password-email"
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
            setErrors((previous) => ({
              ...previous,
              form: undefined,
              email: undefined,
            }));
          }}
        />

        {errors.form ? <FieldError>{errors.form}</FieldError> : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          {pending ? "Sending link…" : "Send reset link"}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-primary font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}

function BackToSignIn() {
  return (
    <Link
      href="/"
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
    >
      <ArrowLeftIcon aria-hidden="true" className="size-4" />
      Back to sign in
    </Link>
  );
}
