import { BrevoTransport } from "../../integrations/brevo/index.js";
import { EmailRenderer, EmailService } from "../email/index.js";
import { createAuthConfig } from "./auth.config.js";

// The Better Auth CLI loads a module and reads a plain `auth` export, which the
// factory in `auth.config.ts` cannot provide on its own.
export const auth = createAuthConfig(
  new EmailService(new BrevoTransport(), new EmailRenderer()),
);
