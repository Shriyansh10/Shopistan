/*
 * Journal — src/schemas/auth.schema.ts
 *
 * 2026-09-26 (Claude): Created. Zod schema + inferred type for the register form. Field names match the
 *   server User model (full_name, email_id, phone_no). Rules: name ≥ 2 chars, valid email,
 *   10-digit Indian mobile (+91 optional), password 8–72 chars with a letter and a number, terms must be ticked.
 *
 * 2026-09-26 (Claude): Split full_name into first_name / last_name (max 45 each). Split phone into
 *   country_code (+ and 1–4 digits) and phone_no (exactly 10 digits). Email capped at 320, password now
 *   8–50 and the length errors state both limits. All limits come from lib/limits.ts.
 *
 * 2026-09-26 (Claude): Replaced the free-text country_code with `country`, an enum of ISO codes from
 *   lib/countries.ts, so only countries in the dropdown are accepted.
 *
 * 2026-09-26 (Claude): phone_no is now 1 to 10 digits instead of exactly 10.
 *
 * 2026-09-29 (Claude): Added loginSchema (email_id + password) for the login page. Password is only
 *   checked for being non-empty — sign-up rules aren't repeated at login.
 */

import { z } from "zod";
import { LIMITS } from "../lib/limits";
import { COUNTRY_ISOS } from "../lib/countries";

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter your ${label}`)
    .max(LIMITS.NAME_MAX, `${label[0].toUpperCase()}${label.slice(1)} must be at most ${LIMITS.NAME_MAX} characters`);

const passwordLengthMessage = `Password must be ${LIMITS.PASSWORD_MIN}–${LIMITS.PASSWORD_MAX} characters`;

export const registerSchema = z.object({
  first_name: name("first name"),
  last_name: name("last name"),
  email_id: z
    .email("Enter a valid email address")
    .max(LIMITS.EMAIL_MAX, `Email must be at most ${LIMITS.EMAIL_MAX} characters`),
  country: z.enum(COUNTRY_ISOS, "Select a country from the list"),
  phone_no: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{1,${LIMITS.PHONE_MAX_DIGITS}}$`), `Enter a phone number of up to ${LIMITS.PHONE_MAX_DIGITS} digits`),
  password: z
    .string()
    .min(LIMITS.PASSWORD_MIN, passwordLengthMessage)
    .max(LIMITS.PASSWORD_MAX, passwordLengthMessage)
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number"),
  terms: z.boolean().refine((v) => v, "You must accept the terms to continue"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email_id: z
    .email("Enter a valid email address")
    .max(LIMITS.EMAIL_MAX, `Email must be at most ${LIMITS.EMAIL_MAX} characters`),
  password: z.string().min(1, "Enter your password"),
});

export type LoginInput = z.infer<typeof loginSchema>;
