import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

function brevoResponse(): Response {
  return new Response(JSON.stringify({ messageId: "brevo-message-id" }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

beforeAll(() => {
  process.env.DATABASE_URL ??=
    "postgresql://postgres:postgres@localhost:5442/dariise_test";
  process.env.BETTER_AUTH_SECRET ??=
    "test-secret-that-is-at-least-32-chars-long";
  process.env.BREVO_API_KEY = "xkeysib-test-key";
  process.env.EMAIL_FROM = "no-reply@dariise.test";
  process.env.EMAIL_SENDER_NAME = "Dariise";
  process.env.EMAIL_SANDBOX = "false";
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.unstubAllGlobals();
  process.env.EMAIL_SANDBOX = "false";
});

async function loadTransport() {
  const { createBrevoTransport } = await import("../../shared/email/email.config.js");

  return createBrevoTransport();
}

const message = {
  to: "ada@example.com",
  toName: "Ada",
  subject: "Reset your Dariise password",
  text: "plain body",
  html: "<p>html body</p>",
};

// Stubs `fetch` rather than Brevo's client, so the SDK's own serialisation runs
// without a network call or an API key.
describe("createBrevoTransport", () => {
  it("posts the message to Brevo's transactional email endpoint", async () => {
    const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
    const fetchStub = vi.fn(async (url: unknown, init?: RequestInit) => {
      calls.push({ url: String(url), init });

      return brevoResponse();
    });
    vi.stubGlobal("fetch", fetchStub);

    const transport = await loadTransport();
    const receipt = await transport.send(message);

    expect(receipt).toEqual({ messageId: "brevo-message-id" });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toContain("/v3/smtp/email");

    const body = JSON.parse(String(calls[0]?.init?.body)) as {
      sender?: { email?: string; name?: string };
      to?: Array<{ email?: string; name?: string }>;
      subject?: string;
      htmlContent?: string;
      textContent?: string;
    };

    expect(body.sender).toEqual({
      email: "no-reply@dariise.test",
      name: "Dariise",
    });
    expect(body.to?.[0]).toEqual({ email: "ada@example.com", name: "Ada" });
    expect(body.subject).toBe(message.subject);
    expect(body.htmlContent).toBe(message.html);
    expect(body.textContent).toBe(message.text);
    // The SDK sends a `Headers` instance, whose lookups are case-insensitive.
    expect(new Headers(calls[0]?.init?.headers).get("api-key")).toBe(
      "xkeysib-test-key",
    );
  });

  it("omits the recipient name when the account has none", async () => {
    const bodies: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: unknown, init?: RequestInit) => {
        bodies.push(String(init?.body));

        return brevoResponse();
      }),
    );

    const transport = await loadTransport();
    await transport.send({ ...message, toName: undefined });

    const body = JSON.parse(bodies[0] ?? "{}") as {
      to?: Array<Record<string, unknown>>;
    };

    expect(body.to?.[0]).toEqual({ email: "ada@example.com" });
  });

  it("marks the request for Brevo's sandbox when EMAIL_SANDBOX is set", async () => {
    const headers: RequestInit["headers"][] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: unknown, init?: RequestInit) => {
        headers.push(init?.headers);

        return brevoResponse();
      }),
    );
    process.env.EMAIL_SANDBOX = "true";
    vi.resetModules();

    const transport = await loadTransport();
    await transport.send(message);

    expect(new Headers(headers[0]).get("X-Sib-Sandbox")).toBe("true");
  });

  it("does not mark the request when sandbox mode is off", async () => {
    const headers: RequestInit["headers"][] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: unknown, init?: RequestInit) => {
        headers.push(init?.headers);

        return brevoResponse();
      }),
    );

    const transport = await loadTransport();
    await transport.send(message);

    expect(new Headers(headers[0]).get("X-Sib-Sandbox")).toBeNull();
  });
});
