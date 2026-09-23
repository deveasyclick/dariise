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

export type EmailSendResult =
  | { status: "sent"; messageId?: string | undefined }
  | { status: "failed"; error: unknown };
