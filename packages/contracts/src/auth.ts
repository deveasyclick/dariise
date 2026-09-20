import { z } from "zod";

import { displayNameSchema, emailSchema, passwordSchema } from "#fields";

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

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;

export const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
  token: z.string().min(1, "Reset token is missing."),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
