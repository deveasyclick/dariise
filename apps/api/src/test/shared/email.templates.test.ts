import { describe, expect, it } from "vitest";

import { EmailRenderer } from "../../modules/email/email.renderer.js";
import type {
  EmailTemplateId,
  EmailTemplateVariables,
} from "../../modules/email/email.templates.js";

// The Better Auth shape: validates the token, then redirects to the dashboard
// with `?token=…`.
const resetUrl =
  "http://localhost:4000/api/auth/reset-password/abc123?callbackURL=%2Freset-password";

const samples: { [Id in EmailTemplateId]: EmailTemplateVariables<Id> } = {
  passwordReset: { name: "Ada", url: resetUrl, expiresInMinutes: 30 },
  verifyEmail: {
    name: "Ada",
    url: "http://localhost:4000/api/auth/verify-email?token=xyz",
  },
};

const renderer = new EmailRenderer();

describe("every registered template", () => {
  it("renders a subject, a text alternative and HTML from its .mjml file", async () => {
    for (const id of Object.keys(samples) as EmailTemplateId[]) {
      const rendered = await renderer.render(id, samples[id]);

      expect(rendered.subject.length).toBeGreaterThan(0);
      expect(rendered.text.length).toBeGreaterThan(0);
      expect(rendered.html.startsWith("<!doctype html>")).toBe(true);
      expect(rendered.html).toContain(samples[id].url);
      expect(rendered.text).toContain(samples[id].url);
      // A placeholder the schema does not supply would survive as literal text.
      expect(rendered.html).not.toContain("{{");
      expect(rendered.text).not.toContain("{{");
    }
  });

  it("fails at construction when the template assets are missing", () => {
    expect(() => new EmailRenderer("/nonexistent-templates")).toThrow();
  });
});

describe("password reset template", () => {
  it("forwards the Better Auth reset URL without rewriting it", async () => {
    const { text, html } = await renderer.render("passwordReset", {
      url: resetUrl,
      expiresInMinutes: 30,
    });

    expect(text).toContain(resetUrl);
    expect(html).toContain("/api/auth/reset-password/abc123");
    expect(html).toContain("callbackURL=%2Freset-password");
    expect(html).toContain(
      'href="http://localhost:4000/api/auth/reset-password/abc123',
    );
  });

  it("quotes the configured expiry in both bodies", async () => {
    const { text, html } = await renderer.render("passwordReset", {
      url: resetUrl,
      expiresInMinutes: 30,
    });

    expect(text).toContain("expires in 30 minutes");
    expect(html).toContain("expires in 30 minutes");
  });

  it("greets a named recipient and escapes the name", async () => {
    const { text, html } = await renderer.render("passwordReset", {
      name: "Ada <ada@example.com>",
      url: resetUrl,
      expiresInMinutes: 30,
    });

    expect(text).toContain("Hi Ada <ada@example.com>,");
    expect(html).toContain("Hi Ada &lt;ada@example.com&gt;,");
    expect(html).not.toContain("<ada@example.com>");
  });

  it("uses a neutral greeting when the name is unknown", async () => {
    const { text, html } = await renderer.render("passwordReset", {
      url: resetUrl,
      expiresInMinutes: 30,
    });

    expect(text.startsWith("Hi,")).toBe(true);
    expect(html).toContain("Hi,");
  });
});

describe("verify email template", () => {
  it("renders the confirmation link for later wiring", async () => {
    const rendered = await renderer.render("verifyEmail", {
      url: "http://localhost:4000/api/auth/verify-email?token=xyz",
      name: "Ada",
    });

    expect(rendered.subject).toBe("Confirm your Dariise email address");
    expect(rendered.text).toContain("token=xyz");
    expect(rendered.html).toContain("token=xyz");
  });
});
