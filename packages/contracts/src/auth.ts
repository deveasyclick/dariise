import { z } from "zod";

import {
  displayNameSchema,
  emailSchema,
  passwordSchema,
  verificationCodeSchema,
} from "#fields";

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
  remember: z.boolean().default(true),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
  acceptedTerms: z.literal(true, {
    error: "Please accept the Terms and Privacy Policy to continue.",
  }),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

/** Ask for a confirmation code to be sent to an address. */
export const requestEmailVerificationSchema = z.object({
  email: emailSchema,
});

export type RequestEmailVerificationInput = z.infer<
  typeof requestEmailVerificationSchema
>;

/**
 * Confirm an address with the code from the email.
 *
 * The code is what the user types, so it is validated as digits rather than
 * as the opaque string the API actually receives.
 */
export const verifyEmailCodeSchema = z.object({
  email: emailSchema,
  code: verificationCodeSchema,
});

export type VerifyEmailCodeInput = z.infer<typeof verifyEmailCodeSchema>;

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;

/**
 * Choose a new password with the code from the email.
 *
 * The address is part of the payload, not just the code: the code is looked up
 * against the account it was issued for, so it cannot be replayed onto another.
 */
export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: verificationCodeSchema,
  newPassword: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
