import { BrevoClient } from "@getbrevo/brevo";
import { env } from "../../config/index.js";
import type {
  EmailReceipt,
  EmailTransport,
  TransactionalEmail,
} from "../../shared/types/email.js";

export class BrevoTransport implements EmailTransport {
  private readonly client = new BrevoClient({
    apiKey: env.brevoApiKey,
    timeoutInSeconds: 30,
  });

  async send({
    to,
    toName,
    subject,
    text,
    html,
  }: TransactionalEmail): Promise<EmailReceipt> {
    const result = await this.client.transactionalEmails.sendTransacEmail({
      sender: {
        email: env.emailFrom,
        name: env.emailSenderName,
      },
      to: [{ email: to, ...(toName ? { name: toName } : {}) }],
      subject,
      htmlContent: html,
      textContent: text,
    });

    return { messageId: result.messageId };
  }
}
