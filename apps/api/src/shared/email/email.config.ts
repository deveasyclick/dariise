// The only file that knows a mail provider exists. The client is built on first
// send because its constructor validates options and import happens during
// startup; retries are Brevo's own, so nothing here retries.

import { BrevoClient } from "@getbrevo/brevo";

import { emailEnabled, env } from "../../config/index.js";
import type { EmailTransport } from "./email.types.js";

export function createBrevoTransport(): EmailTransport {
  let client: BrevoClient | null = null;

  function brevo(): BrevoClient {
    if (!client) {
      client = new BrevoClient({
        apiKey: env.brevoApiKey as string,
        timeoutInSeconds: 30,
      });
    }

    return client;
  }

  return {
    async send({ to, toName, subject, text, html }) {
      const result = await brevo().transactionalEmails.sendTransacEmail(
        {
          sender: {
            email: env.emailFrom as string,
            name: env.emailSenderName,
          },
          to: [{ email: to, ...(toName ? { name: toName } : {}) }],
          subject,
          htmlContent: html,
          textContent: text,
        },
        // Sandbox mode accepts the call and validates it without delivering,
        // which is what makes the flow testable without mailing real inboxes.
        env.emailSandbox
          ? { headers: { "X-Sib-Sandbox": "true" } }
          : undefined,
      );

      return { messageId: result.messageId };
    },
  };
}

// `null` means Brevo is not set up, which sends the caller to `EmailService`'s
// development fallback instead of a half-working mail path.
export function createConfiguredEmailTransport(): EmailTransport | null {
  return emailEnabled ? createBrevoTransport() : null;
}
