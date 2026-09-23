import type {
  EmailSendResult,
  EmailTransport,
} from "../../shared/types/email.js";
import type { EmailRenderer } from "./email.renderer.js";
import type {
  EmailTemplateId,
  EmailTemplateVariables,
} from "./email.templates.js";
import type { TemplatedEmail } from "./email.types.js";

export class EmailService {
  constructor(
    private readonly transport: EmailTransport,
    private readonly renderer: EmailRenderer,
  ) {}

  async send<Id extends EmailTemplateId>(
    message: TemplatedEmail<Id, EmailTemplateVariables<Id>>,
  ): Promise<EmailSendResult> {
    try {
      const rendered = await this.renderer.render(
        message.template,
        message.variables,
      );

      const receipt = await this.transport.send({
        to: message.to,
        toName: message.toName,
        ...rendered,
      });

      console.info(
        `[email] sent "${rendered.subject}" to ${message.to}${
          receipt.messageId ? ` (${receipt.messageId})` : ""
        }`,
      );

      return { status: "sent", messageId: receipt.messageId };
    } catch (error) {
      console.error(
        `[email] delivery to ${message.to} failed`,
        error instanceof Error ? error.message : error,
      );

      return { status: "failed", error };
    }
  }
}
