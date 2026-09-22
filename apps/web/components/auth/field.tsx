"use client";

import { useState, type ReactNode } from "react";
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FieldProps extends Omit<React.ComponentProps<"input">, "id"> {
  id: string;
  label: string;
  /** Rendered on the right-hand side of the label row, e.g. a link. */
  labelSuffix?: ReactNode;
  /** Explanatory copy shown under the control, e.g. how the value is used. */
  hint?: ReactNode;
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
  hint,
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
      {hint ? <FieldHint>{hint}</FieldHint> : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

interface PrefixedFieldProps extends Omit<React.ComponentProps<"input">, "id"> {
  id: string;
  label: string;
  /** Static text shown inside the field, before the value, e.g. `acme.dev/`. */
  prefix: string;
  hint?: ReactNode;
  error?: string | null;
}

/**
 * Input whose value is completed by a fixed prefix.
 *
 * The prefix is a static part of the address rather than an editable value, so
 * it sits inside the same border as the input and is never submitted.
 */
export function PrefixedField({
  id,
  label,
  prefix,
  hint,
  error,
  className,
  ...props
}: PrefixedFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div
        className={cn(
          "flex h-8 w-full min-w-0 items-center rounded-lg border border-input bg-transparent px-2.5 text-base transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 md:text-sm dark:bg-input/30",
          error &&
            "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
          className,
        )}
      >
        <span className="text-muted-foreground shrink-0 select-none">
          {prefix}
        </span>
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="placeholder:text-muted-foreground h-full min-w-0 flex-1 bg-transparent outline-none disabled:pointer-events-none disabled:cursor-not-allowed"
          {...props}
        />
      </div>
      {hint ? <FieldHint>{hint}</FieldHint> : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

/** Explanatory copy shown under a control. */
export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground text-xs leading-5">{children}</p>;
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
