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
