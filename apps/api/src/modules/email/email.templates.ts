import { z } from "zod";

import type { EmailTemplate } from "./email.types.js";

export const emailTemplates = {
  passwordReset: {
    file: "password-reset.mjml",
    subject: "Reset your Dariise password",
    text: [
      "{{greeting}}",
      "",
      "We received a request to reset the password for your Dariise account.",
      "Choose a new password here:",
      "",
      "{{url}}",
      "",
      "This link can be used once and expires in {{expiresInMinutes}} minutes.",
      "If you did not request a password reset, you can ignore this email — your password will not change.",
      "",
      "— Dariise",
    ].join("\n"),
    schema: z
      .strictObject({
        name: z.string().trim().min(1).optional(),
        url: z.url(),
        expiresInMinutes: z.number().int().positive(),
      })
      .transform(({ name, url, expiresInMinutes }) => ({
        name: name ?? "",
        greeting: name ? `Hi ${name},` : "Hi,",
        url,
        expiresInMinutes: String(expiresInMinutes),
      })),
  },
  verifyEmail: {
    file: "verify-email.mjml",
    subject: "Confirm your Dariise email address",
    text: [
      "{{greeting}}",
      "",
      "Confirm this address to finish setting up your Dariise account:",
      "",
      "{{url}}",
      "",
      "If you did not create a Dariise account, you can ignore this email.",
      "",
      "— Dariise",
    ].join("\n"),
    schema: z
      .strictObject({
        name: z.string().trim().min(1).optional(),
        url: z.url(),
      })
      .transform(({ name, url }) => ({
        name: name ?? "",
        greeting: name ? `Hi ${name},` : "Hi,",
        url,
      })),
  },
} as const satisfies Record<string, EmailTemplate>;

export type EmailTemplateId = keyof typeof emailTemplates;

export type EmailTemplateVariables<Id extends EmailTemplateId> = z.input<
  (typeof emailTemplates)[Id]["schema"]
>;
