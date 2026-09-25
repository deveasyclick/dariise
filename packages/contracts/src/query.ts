import { z } from "zod";

/**
 * A boolean query parameter.
 *
 * `z.coerce.boolean()` is wrong for a query string: every non-empty value is
 * truthy, so `?includeArchived=false` parses as `true`. Only an explicit true
 * or false is accepted, and anything else is rejected rather than guessed at.
 */
export const booleanQueryParamSchema = z.stringbool({
  truthy: ["true"],
  falsy: ["false"],
  error: 'Use "true" or "false".',
});
