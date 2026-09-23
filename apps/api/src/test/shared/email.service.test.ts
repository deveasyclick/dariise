import { afterEach, describe, expect, it, vi } from "vitest";

import { EmailRenderer } from "../../modules/email/email.renderer.js";
import { EmailService } from "../../modules/email/email.service.js";
import type {
  EmailReceipt,
  EmailTransport,
  TransactionalEmail,
} from "../../shared/types/email.js";

const url = "http://localhost:4000/api/auth/reset-password/secret-token";

const variables = { name: "Ada", url, expiresInMinutes: 30 };

/** A transport that records what it was asked to send. */
function recordingTransport(messages: TransactionalEmail[]): EmailTransport {
  return {
    async send(message: TransactionalEmail): Promise<EmailReceipt> {
      messages.push(message);

      return { messageId: "brevo-message-id" };
    },
  };
}

function service(transport: EmailTransport): EmailService {
  return new EmailService(transport, new EmailRenderer());
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EmailService", () => {
  it("hands the rendered message to the transport", async () => {
    const messages: TransactionalEmail[] = [];
    const result = await service(recordingTransport(messages)).send({
      template: "passwordReset",
      to: "ada@example.com",
      toName: "Ada",
      variables,
    });

    expect(result).toEqual({ status: "sent", messageId: "brevo-message-id" });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.to).toBe("ada@example.com");
    expect(messages[0]?.toName).toBe("Ada");
    expect(messages[0]?.subject).toBe("Reset your Dariise password");
    expect(messages[0]?.text).toContain(url);
    expect(messages[0]?.html).toContain(
      "/api/auth/reset-password/secret-token",
    );
  });

  it("reports an invalid variable bag as a failure instead of throwing", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const messages: TransactionalEmail[] = [];
    const result = await service(recordingTransport(messages)).send({
      template: "passwordReset",
      to: "ada@example.com",
      variables: { name: "Ada", url, expiresInMinutes: 0 },
    });

    expect(result.status).toBe("failed");
    expect(messages).toHaveLength(0);
    expect(logged.mock.calls.flat().join("\n")).toContain(
      "Invalid email template variables",
    );
  });

  it("reports a provider failure without throwing or leaking the token", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const failing: EmailTransport = {
      async send() {
        throw new Error("Brevo answered 401");
      },
    };
    const result = await service(failing).send({
      template: "passwordReset",
      to: "ada@example.com",
      variables,
    });

    expect(result.status).toBe("failed");
    expect(logged.mock.calls.flat().join("\n")).not.toContain("secret-token");
  });
});
