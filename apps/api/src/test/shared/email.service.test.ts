import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type {
  EmailReceipt,
  EmailTransport,
  TransactionalEmail,
} from "../../shared/email/email.types.js";

// `config/index.ts` validates the environment at module load, so these must exist
// before anything is imported. `NODE_ENV` stays development except where a test
// needs the production console fallback.
beforeAll(() => {
  process.env.DATABASE_URL ??=
    "postgresql://postgres:postgres@localhost:5442/dariise_test";
  process.env.BETTER_AUTH_SECRET ??= "test-secret-that-is-at-least-32-chars-long";
  process.env.NODE_ENV = "development";
  delete process.env.BREVO_API_KEY;
  delete process.env.EMAIL_FROM;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

interface Recorded {
  messages: TransactionalEmail[];
}

/** A transport that records what it was asked to send. */
function recordingTransport(
  messages: TransactionalEmail[],
): EmailTransport & Recorded {
  return {
    messages,
    async send(message: TransactionalEmail): Promise<EmailReceipt> {
      messages.push(message);

      return { messageId: "brevo-message-id" };
    },
  };
}

async function loadEmailService() {
  // Imported dynamically so the module graph sees the environment `beforeAll`
  // configured.
  const [{ EmailService }, emailConfig, config] = await Promise.all([
    import("../../shared/email/email.service.js"),
    import("../../shared/email/email.config.js"),
    import("../../config/index.js"),
  ]);

  return { EmailService, emailConfig, config };
}

describe("EmailService without a transport", () => {
  it("reports the send as skipped rather than failing the request", async () => {
    const { EmailService, emailConfig, config } =
      await loadEmailService();

    expect(config.emailEnabled).toBe(false);

    const service = new EmailService(emailConfig.createConfiguredEmailTransport());

    await expect(
      service.sendPasswordReset({
        to: "ada@example.com",
        name: "Ada",
        url: "http://localhost:4000/api/auth/reset-password/tok",
        expiresInMinutes: 30,
      }),
    ).resolves.toEqual({ status: "skipped", reason: "not_configured" });
  });

  it("prints the reset link to a development console instead of dropping it", async () => {
    const { EmailService, emailConfig } = await loadEmailService();
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const service = new EmailService(
      emailConfig.createConfiguredEmailTransport(),
    );

    await service.sendPasswordReset({
      to: "ada@example.com",
      url: "http://localhost:4000/api/auth/reset-password/tok",
      expiresInMinutes: 30,
    });

    const printed = info.mock.calls.flat().join("\n");

    expect(printed).toContain("no transport configured");
    expect(printed).toContain("ada@example.com");
  });

  it("never prints the link in production", async () => {
    process.env.NODE_ENV = "production";
    vi.resetModules();

    const { EmailService, emailConfig } = await loadEmailService();
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const service = new EmailService(
      emailConfig.createConfiguredEmailTransport(),
    );
    const url = "http://localhost:4000/api/auth/reset-password/secret-token";

    await service.sendPasswordReset({
      to: "ada@example.com",
      url,
      expiresInMinutes: 30,
    });

    const logged = [...info.mock.calls, ...warn.mock.calls].flat().join("\n");

    expect(logged).not.toContain("secret-token");
    expect(warn).toHaveBeenCalled();
  });
});

describe("EmailService with a transport", () => {
  it("hands the rendered message to the transport", async () => {
    const { EmailService } = await loadEmailService();
    const messages: TransactionalEmail[] = [];
    const service = new EmailService(recordingTransport(messages));
    const url = "http://localhost:4000/api/auth/reset-password/tok";

    const result = await service.sendPasswordReset({
      to: "ada@example.com",
      name: "Ada",
      url,
      expiresInMinutes: 30,
    });

    expect(result).toEqual({ status: "sent", messageId: "brevo-message-id" });
    expect(service.enabled).toBe(true);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.to).toBe("ada@example.com");
    expect(messages[0]?.toName).toBe("Ada");
    expect(messages[0]?.subject).toBe("Reset your Dariise password");
    expect(messages[0]?.text).toContain(url);
    expect(messages[0]?.html).toContain("/api/auth/reset-password/tok");
  });

  it("reports a provider failure without throwing or leaking the token", async () => {
    const { EmailService } = await loadEmailService();
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const failing: EmailTransport = {
      async send() {
        throw new Error("Brevo answered 401");
      },
    };
    const service = new EmailService(failing);
    const url = "http://localhost:4000/api/auth/reset-password/secret-token";

    const result = await service.send({ to: "ada@example.com", ...render(url) });

    expect(result.status).toBe("failed");
    expect(error.mock.calls.flat().join("\n")).not.toContain("secret-token");
  });
});

/** Render a message without going through a template helper. */
function render(url: string) {
  return {
    subject: "Reset your Dariise password",
    text: `Reset: ${url}`,
    html: `<a href="${url}">Reset</a>`,
  };
}
