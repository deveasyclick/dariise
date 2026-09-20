import { z } from "zod";

/**
 * A field-keyed error map, matching what each auth form renders.
 *
 * `form` carries errors that belong to no single input — a rejected credential
 * pair, a transport failure — which the forms display above the submit button.
 */
export type FieldErrors<Field extends string> = Partial<
  Record<Field | "form", string>
>;

/**
 * Flatten a zod result into a field-keyed error map.
 *
 * Only the first issue per field is kept: the forms render one message under
 * each input, and a validation run that reports three problems with a password
 * would otherwise overwrite the most useful one with the last.
 */
export function toFieldErrors<Field extends string>(
  error: z.ZodError,
): FieldErrors<Field> {
  const errors: FieldErrors<Field> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field === undefined) continue;

    const key = String(field) as Field;
    if (errors[key] === undefined) {
      errors[key] = issue.message;
    }
  }

  return errors;
}
