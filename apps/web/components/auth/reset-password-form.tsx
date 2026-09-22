"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, LoaderCircleIcon } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { FieldError, PasswordField } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { AuthError, resetPassword } from "@/lib/auth";
import { PASSWORD_MIN_LENGTH } from "@dariise/contracts";

interface ResetPasswordErrors {
  form?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface ResetPasswordFormProps {
  /** The single-use token from the reset link. */
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<ResetPasswordErrors>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const nextErrors: ResetPasswordErrors = {
      newPassword:
        newPassword.length < PASSWORD_MIN_LENGTH
          ? `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
          : undefined,
      confirmPassword:
        confirmPassword !== newPassword
          ? "Both passwords must match."
          : undefined,
    };

    if (nextErrors.newPassword || nextErrors.confirmPassword) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setPending(true);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await resetPassword({ token, newPassword }, controller.signal);
      setDone(true);
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;

      if (error instanceof AuthError) {
        setErrors((previous) => ({
          ...previous,
          ...(error.fieldErrors as ResetPasswordErrors),
        }));
        return;
      }

      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <AuthCard
        title="Password updated"
        description="Your password has been changed. Sign in with your new password."
        backLink={<BackToSignIn />}
      >
        <Button asChild className="w-full">
          <Link href="/">Return to sign in</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      description="Pick a password you have not used for Dariise before."
      backLink={<BackToSignIn />}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <PasswordField
          id="reset-password-new"
          label="New password"
          name="newPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          value={newPassword}
          error={errors.newPassword}
          onChange={(event) => {
            setNewPassword(event.target.value);
            setErrors((previous) => ({
              ...previous,
              form: undefined,
              newPassword: undefined,
            }));
          }}
        />

        <PasswordField
          id="reset-password-confirm"
          label="Confirm new password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          value={confirmPassword}
          error={errors.confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setErrors((previous) => ({
              ...previous,
              form: undefined,
              confirmPassword: undefined,
            }));
          }}
        />

        {errors.form ? <FieldError>{errors.form}</FieldError> : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          {pending ? "Updating password…" : "Update password"}
        </Button>
      </form>
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
