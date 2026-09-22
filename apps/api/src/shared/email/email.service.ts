// Mail is a non-critical side effect: a provider outage must not fail the request
// that triggered it, so `send` reports an outcome instead of throwing. The reset
// link is a credential, so it is printed outside production only.

import { isProduction } from "../../config/index.js";
import { renderPasswordResetEmail } from "./email.templates.js";
import type {
  EmailSendResult,
  EmailTransport,
  PasswordResetEmail,
  TransactionalEmail,
} from "./email.types.js";

export class EmailService {
  constructor(readonly transport: EmailTransport | null) {}

  /** Whether a real transport is configured for this deployment. */
  get enabled(): boolean {
    return this.transport !== null;
  }

  /** Send a message, reporting failure instead of raising it. */
  async send(message: TransactionalEmail): Promise<EmailSendResult> {
    const { transport } = this;

    if (!transport) {
      if (isProduction) {
        console.warn(
          `[email] no transport is configured — the message to ${message.to} was not delivered. Set BREVO_API_KEY and EMAIL_FROM to enable mail.`,
        );
      } else {
        console.info(
          [
            "",
            "  ── email (no transport configured) ────────────────────────",
            `  to:      ${message.to}`,
            `  subject: ${message.subject}`,
            "  set BREVO_API_KEY and EMAIL_FROM to deliver this for real.",
            "  ────────────────────────────────────────────────────────────",
            "",
          ].join("\n"),
        );
      }

      return { status: "skipped", reason: "not_configured" };
    }

    try {
      const receipt = await transport.send(message);

      console.info(
        `[email] sent "${message.subject}" to ${message.to}${
          receipt.messageId ? ` (${receipt.messageId})` : ""
        }`,
      );

      return { status: "sent", messageId: receipt.messageId };
    } catch (error) {
      // The caller is usually a Better Auth callback, which logs and swallows
      // its own errors; this is where an operator gets the reason.
      console.error(
        `[email] delivery to ${message.to} failed`,
        error instanceof Error ? error.message : error,
      );

      return { status: "failed", error };
    }
  }

  async sendPasswordReset({
    to,
    name,
    url,
    expiresInMinutes,
  }: PasswordResetEmail): Promise<EmailSendResult> {
    return this.send({
      to,
      toName: name,
      ...renderPasswordResetEmail({ url, name, expiresInMinutes }),
    });
  }
}
