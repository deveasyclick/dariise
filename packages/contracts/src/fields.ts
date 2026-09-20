import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const emailSchema = z
  .email("Enter a valid email address.")
  .max(254, "Email must be at most 254 characters.");

export const passwordSchema = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
  )
  .max(
    PASSWORD_MAX_LENGTH,
    `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`,
  );

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required.")
  .max(80, "Name must be at most 80 characters.");
