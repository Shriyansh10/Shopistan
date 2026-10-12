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
