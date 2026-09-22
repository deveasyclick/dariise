// Table-based, inline-styled markup: email clients ignore stylesheets and many
// still lack flexbox. Interpolated values are escaped — a display name is user
// input and the client renders HTML.

import type {
  PasswordResetEmailInput,
  RenderedEmail,
} from "./email.types.js";

/** Escape a value for interpolation into HTML text or a double-quoted attribute. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface LayoutOptions {
  /** Preview text shown beside the subject line in a client's inbox list. */
  preheader: string;
  heading: string;
  paragraphs: string[];
  action: { label: string; url: string };
  footnote: string;
}

// The shell: wordmark, heading, body copy, one button, the raw link, footnote.
function renderLayout({
  preheader,
  heading,
  paragraphs,
  action,
  footnote,
}: LayoutOptions): string {
  const body = paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#3f3f46;">${paragraph}</p>`,
    )
    .join("\n            ");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 24px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">Dariise</p>
                <h1 style="margin:0 0 16px;font-size:20px;line-height:28px;color:#18181b;">${escapeHtml(heading)}</h1>
            ${body}
                <p style="margin:24px 0;">
                  <a href="${escapeHtml(action.url)}" style="display:inline-block;background-color:#18181b;color:#fafafa;font-size:15px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;">${escapeHtml(action.label)}</a>
                </p>
                <p style="margin:0 0 4px;font-size:13px;line-height:20px;color:#71717a;">If the button does not work, copy this link into your browser:</p>
                <p style="margin:0 0 24px;font-size:13px;line-height:20px;word-break:break-all;"><a href="${escapeHtml(action.url)}" style="color:#2563eb;">${escapeHtml(action.url)}</a></p>
                <p style="margin:0;padding-top:16px;border-top:1px solid #e4e4e7;font-size:13px;line-height:20px;color:#71717a;">${escapeHtml(footnote)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// `url` is forwarded untouched; the note on `sendResetPassword` in the auth
// config explains why.
export function renderPasswordResetEmail({
  url,
  name,
  expiresInMinutes,
}: PasswordResetEmailInput): RenderedEmail {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi,";

  return {
    subject: "Reset your Dariise password",
    text: [
      name ? `Hi ${name},` : "Hi,",
      "",
      "We received a request to reset the password for your Dariise account.",
      "Choose a new password here:",
      "",
      url,
      "",
      `This link can be used once and expires in ${expiresInMinutes} minutes.`,
      "If you did not request a password reset, you can ignore this email — your password will not change.",
      "",
      "— Dariise",
    ].join("\n"),
    html: renderLayout({
      preheader: `Reset your Dariise password — the link expires in ${expiresInMinutes} minutes.`,
      heading: "Reset your password",
      paragraphs: [
        greeting,
        "We received a request to reset the password for your Dariise account. Choose a new password using the button below.",
      ],
      action: { label: "Choose a new password", url },
      footnote: `This link can be used once and expires in ${expiresInMinutes} minutes. If you did not request a password reset, you can ignore this email — your password will not change.`,
    }),
  };
}

export interface VerifyEmailEmailInput {
  url: string;
  name?: string | undefined;
}

// Rendered and tested but not wired: `requireEmailVerification` stays off until
// that is a deliberate product decision; wiring it is one callback in the config.
export function renderVerifyEmailEmail({
  url,
  name,
}: VerifyEmailEmailInput): RenderedEmail {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi,";

  return {
    subject: "Confirm your Dariise email address",
    text: [
      name ? `Hi ${name},` : "Hi,",
      "",
      "Confirm this address to finish setting up your Dariise account:",
      "",
      url,
      "",
      "If you did not create a Dariise account, you can ignore this email.",
      "",
      "— Dariise",
    ].join("\n"),
    html: renderLayout({
      preheader: "Confirm your email address to finish setting up Dariise.",
      heading: "Confirm your email",
      paragraphs: [
        greeting,
        "Confirm this address to finish setting up your Dariise account.",
      ],
      action: { label: "Confirm email address", url },
      footnote:
        "If you did not create a Dariise account, you can ignore this email.",
    }),
  };
}
