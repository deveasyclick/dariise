import { describe, expect, it } from "vitest";

import {
  escapeHtml,
  renderPasswordResetEmail,
  renderVerifyEmailEmail,
} from "../../shared/email/email.templates.js";

// The Better Auth shape: validates the token, then redirects to the dashboard
// with `?token=…`.
const resetUrl =
  "http://localhost:4000/api/auth/reset-password/abc123?callbackURL=%2Freset-password";

describe("escapeHtml", () => {
  it("neutralises markup and attribute delimiters", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
    expect(escapeHtml("A & B's")).toBe("A &amp; B&#39;s");
  });
});

describe("renderPasswordResetEmail", () => {
  it("forwards the Better Auth reset URL without rewriting it", () => {
    const { text, html } = renderPasswordResetEmail({
      url: resetUrl,
      expiresInMinutes: 30,
    });

    expect(text).toContain(resetUrl);
    // The `?` and `=` of the query string survive HTML escaping, so the token
    // path and its callback are both present in the markup.
    expect(html).toContain("/api/auth/reset-password/abc123");
    expect(html).toContain("callbackURL=%2Freset-password");
    // The link is a real anchor, not plain text.
    expect(html).toContain('<a href="http://localhost:4000/api/auth/reset-password/abc123');
  });

  it("quotes the configured expiry in both bodies", () => {
    const { text, html } = renderPasswordResetEmail({
      url: resetUrl,
      expiresInMinutes: 30,
    });

    expect(text).toContain("expires in 30 minutes");
    expect(html).toContain("expires in 30 minutes");
  });

  it("greets a named recipient and escapes the name", () => {
    const { text, html } = renderPasswordResetEmail({
      url: resetUrl,
      name: `Ada <ada@example.com>`,
      expiresInMinutes: 30,
    });

    expect(text).toContain("Hi Ada <ada@example.com>,");
    expect(html).toContain("Hi Ada &lt;ada@example.com&gt;,");
    expect(html).not.toContain("<ada@example.com>");
  });

  it("uses a neutral greeting when the name is unknown", () => {
    const { text, html } = renderPasswordResetEmail({
      url: resetUrl,
      expiresInMinutes: 30,
    });

    expect(text.startsWith("Hi,")).toBe(true);
    expect(html).toContain("Hi,");
  });

  it("carries a subject and a text alternative", () => {
    const rendered = renderPasswordResetEmail({
      url: resetUrl,
      expiresInMinutes: 30,
    });

    expect(rendered.subject).toBe("Reset your Dariise password");
    expect(rendered.text.length).toBeGreaterThan(0);
    expect(rendered.html).toContain("<!doctype html>");
  });
});

describe("renderVerifyEmailEmail", () => {
  it("renders the confirmation link for later wiring", () => {
    const rendered = renderVerifyEmailEmail({
      url: "http://localhost:4000/api/auth/verify-email?token=xyz",
      name: "Ada",
    });

    expect(rendered.subject).toBe("Confirm your Dariise email address");
    expect(rendered.text).toContain("token=xyz");
    expect(rendered.html).toContain("token=xyz");
  });
});
