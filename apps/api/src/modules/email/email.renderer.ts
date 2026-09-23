import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import mjml2html from "mjml";

import { substituteHtml, substituteText } from "./utils/substitution.js";
import {
  emailTemplates,
  type EmailTemplateId,
  type EmailTemplateVariables,
} from "./email.templates.js";
import type { EmailTemplate, RenderedEmail } from "./email.types.js";

const EMAIL_TEMPLATES_DIR = fileURLToPath(
  new URL("./templates/", import.meta.url),
);

export class EmailRenderer {
  private readonly sources = new Map<EmailTemplateId, string>();

  constructor(templatesDirectory: string = EMAIL_TEMPLATES_DIR) {
    for (const id of Object.keys(emailTemplates) as EmailTemplateId[]) {
      const template: EmailTemplate = emailTemplates[id];

      this.sources.set(
        id,
        readFileSync(join(templatesDirectory, template.file), "utf8"),
      );
    }
  }

  async render<Id extends EmailTemplateId>(
    id: Id,
    variables: EmailTemplateVariables<Id>,
  ): Promise<RenderedEmail> {
    const template: EmailTemplate = emailTemplates[id];
    const parsed = template.schema.safeParse(variables);

    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");

      throw new Error(
        `Invalid email template variables for "${id}": ${details}`,
      );
    }

    const substitutions = this.values(parsed.data);

    const source = substituteHtml(this.sources.get(id) ?? "", substitutions);

    let compiled: Awaited<ReturnType<typeof mjml2html>>;

    try {
      compiled = await mjml2html(source, { validationLevel: "strict" });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);

      throw new Error(
        `The "${id}" email template failed to compile: ${reason.replaceAll(/\s+/g, " ").trim()}`,
        { cause: error },
      );
    }

    if (compiled.errors.length > 0) {
      throw new Error(
        `The "${id}" email template did not validate: ${compiled.errors
          .map((error) => error.formattedMessage)
          .join("; ")}`,
      );
    }

    return {
      subject: substituteText(template.subject, substitutions),
      text: substituteText(template.text, substitutions),
      html: compiled.html,
    };
  }

  private values(data: unknown): Record<string, string> {
    if (typeof data !== "object" || data === null) {
      return {};
    }

    const substituted: Record<string, string> = {};

    for (const [key, value] of Object.entries(data)) {
      substituted[key] =
        value === undefined || value === null ? "" : String(value);
    }

    return substituted;
  }
}
