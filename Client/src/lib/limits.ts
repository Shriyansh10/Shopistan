/*
 * Journal — src/lib/limits.ts
 *
 * 2026-09-26 (Claude): Created. Single source of truth for user input limits on the client.
 *   Mirrors the server User model: first/last name 45, email 320 (DB column 322 incl. buffer),
 *   password 50 (DB column 66 incl. buffer for the hash), phone = country code + 10-digit number.
 *
 * 2026-09-26 (Claude): Removed COUNTRY_CODE_MAX_DIGITS — the country code is now picked from the
 *   list in lib/countries.ts instead of being typed.
 *
 * 2026-09-26 (Claude): Replaced PHONE_DIGITS with PHONE_MAX_DIGITS — phone is up to 10 digits, not exactly 10.
 */

export const LIMITS = {
  NAME_MAX: 45,
  EMAIL_MAX: 320,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 50,
  PHONE_MAX_DIGITS: 10,
} as const;
