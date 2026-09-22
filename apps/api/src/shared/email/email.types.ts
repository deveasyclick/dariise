/** One transactional message, already rendered. */
export interface TransactionalEmail {
  to: string;
  toName?: string | undefined;
  subject: string;
  /** Always sent alongside the HTML, which some clients refuse to render. */
  text: string;
  html: string;
}

/** What the provider adapter reports back for a message it accepted. */
export interface EmailReceipt {
  messageId?: string | undefined;
}

// Implementations must throw on failure: `EmailService` is what decides that a
// failure is logged and swallowed rather than propagated into a request.
export interface EmailTransport {
  send(message: TransactionalEmail): Promise<EmailReceipt>;
}

// `skipped` is not a failure: an unconfigured deployment is a supported
// configuration, not an error.
export type EmailSendResult =
  | { status: "sent"; messageId?: string | undefined }
  | { status: "skipped"; reason: "not_configured" }
  | { status: "failed"; error: unknown };

/** The rendered body of an email, before a recipient is attached. */
export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

/** Everything needed to mail a password-reset link. */
export interface PasswordResetEmail {
  to: string;
  name?: string | undefined;
  /** Better Auth's reset URL, forwarded untouched. */
  url: string;
  /** Quoted in the body; keeps the copy in step with the token's lifetime. */
  expiresInMinutes: number;
}

/** The same content before a recipient is attached — what a template renders. */
export type PasswordResetEmailInput = Omit<PasswordResetEmail, "to">;
