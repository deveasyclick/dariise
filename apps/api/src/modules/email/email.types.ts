import type { z } from "zod";

/**
 * One entry in the registry: where its markup lives, and the schema that turns
 * a caller's input into the template's substitution vocabulary.
 */
export interface EmailTemplate {
  file: `${string}.mjml`;
  subject: string;
  text: string;
  schema: z.ZodType;
}

/** The rendered body of an email, before a recipient is attached. */
export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

/** One template, its variables, and its recipient. */
export interface TemplatedEmail<Id extends string, TVariables> {
  to: string;
  toName?: string | undefined;
  template: Id;
  variables: TVariables;
}
