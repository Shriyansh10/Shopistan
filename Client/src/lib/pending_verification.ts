/*
 * Journal — src/lib/pending_verification.ts
 *
 * 2026-09-27 (Claude): Created. Remembers which email is waiting for OTP verification in sessionStorage,
 *   so /verify-otp still works after a page refresh (router state is lost on reload). sessionStorage is
 *   per-tab and cleared when the tab closes. Every access is wrapped in try/catch because storage can be
 *   blocked (private mode, disabled site data) — the page then just falls back to router state.
 *   Interim client-side fix: once the verify API exists, the server should track the pending user.
 */

const KEY = "shopistan:pending-verification-email";

export function setPendingEmail(email: string) {
  try {
    sessionStorage.setItem(KEY, email);
  } catch {
    // storage unavailable — router state still carries the email for this navigation
  }
}

export function getPendingEmail(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

// call after the OTP is verified successfully
export function clearPendingEmail() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
