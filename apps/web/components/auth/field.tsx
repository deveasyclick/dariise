"use client";

import { useState, type ReactNode } from "react";
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FieldProps extends Omit<React.ComponentProps<"input">, "id"> {
  id: string;
  label: string;
  /** Rendered on the right-hand side of the label row, e.g. a link. */
  labelSuffix?: ReactNode;
  error?: string | null;
}

/**
 * Labelled input with inline error messaging.
 *
 * Owns the `aria-invalid` / `aria-describedby` wiring so every form gets
 * consistent, accessible validation feedback.
 */
export function Field({
  id,
  label,
  labelSuffix,
  error,
  className,
  ...props
}: FieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {labelSuffix}
      </div>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={className}
        {...props}
      />
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

interface FieldErrorProps {
  id?: string;
  children: ReactNode;
}

export function FieldError({ id, children }: FieldErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      className="text-danger-ink flex items-start gap-1.5 text-xs leading-5"
    >
      <AlertCircleIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

interface FieldRowProps {
  /** The control itself, e.g. a `Checkbox`. */
  control: ReactNode;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}

/** A checkbox paired with its inline label. */
export function FieldRow({
  control,
  htmlFor,
  children,
  className,
}: FieldRowProps) {
  return (
    <div className={className}>
      <div className="flex items-start gap-2.5">
        {control}
        <Label
          htmlFor={htmlFor}
          className="text-muted-foreground text-sm leading-5 font-normal"
        >
          {children}
        </Label>
      </div>
    </div>
  );
}

interface PasswordFieldProps
  extends Omit<React.ComponentProps<"input">, "id" | "type"> {
  id: string;
  label: string;
  labelSuffix?: ReactNode;
  error?: string | null;
}

/**
 * Password input with a reveal toggle.
 *
 * The toggle is a `type="button"` sibling so it never submits the form, and it
 * only changes the input's `type`, leaving value and focus untouched.
 */
export function PasswordField({
  id,
  label,
  labelSuffix,
  error,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {labelSuffix}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          className="pr-9"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-lg transition-colors outline-none focus-visible:ring-3"
        >
          {visible ? (
            <EyeOffIcon aria-hidden="true" className="size-4" />
          ) : (
            <EyeIcon aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}
