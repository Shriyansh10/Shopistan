/*
 * Journal — src/app/(auth)/VerifyOtp.tsx
 *
 * 2026-09-27 (Claude): Created from Figma "Web / 03 — Verify OTP" (node 8:93). UI only — no API calls yet.
 *   Reuses AuthLayout. Reads the phone number from router state (set by Register after sign-up) and
 *   redirects to /register if opened directly. Six single-digit boxes: typing moves forward, Backspace
 *   moves back, arrow keys navigate, pasting a code fills all boxes, and the browser can autofill SMS
 *   codes (autocomplete="one-time-code"). 120s resend countdown, then a "Resend code" button that restarts it.
 *   Verify is disabled until all 6 digits are entered. "Change phone number" goes back to /register.
 *
 * 2026-09-27 (Claude): onSubmit typed with SubmitEvent<HTMLFormElement> instead of the deprecated FormEvent
 *   (@types/react 19.3 deprecates FormEvent because no such DOM event exists).
 *
 * 2026-09-27 (Claude): OTP is sent to the user's email, not their phone. Page now reads `email` (not
 *   `phone`) from router state, falling back to sessionStorage (lib/pending_verification.ts) so a refresh
 *   no longer bounces to /register. Copy changed to "Verify your email" / "Change email". Resend timer
 *   now formats as m:ss (2:00, 1:59 ...) instead of hard-coding "0:", which broke with 120 seconds.
 *
 * 2026-09-29 (Claude): Invalid-OTP error. Verify now awaits verifyOtp() (it wasn't awaited, so the catch
 *   never ran and the page moved on before the server replied). A failure shows the server's message
 *   (e.g. "Invalid OTP") under the boxes via toApiError() and outlines every box in red. The error
 *   clears when a digit is changed or a code is resent. The button reads "Verifying..." while waiting.
 *   Resend failures show in the same spot. On success it clears the pending email and goes to
 *   /auth/login with useNavigate (was the browser's global `navigation`, which reloads the page).
 *   Redirects / "Change email" now point to /auth/register (the /register route doesn't exist).
 */

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type SubmitEvent,
} from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import AuthLayout from "./AuthLayout";
import {
  clearPendingEmail,
  getPendingEmail,
} from "../../lib/pending_verification";
import { sendOtp, verifyOtp } from "../../services/auth.service";
import { toApiError } from "../../lib/api_error";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 120;

export type VerifyOtpState = { email: string };

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  // router state after sign-up; sessionStorage covers a page refresh
  const email =
    (location.state as VerifyOtpState | null)?.email ?? getPendingEmail();

  const [digits, setDigits] = useState<string[]>(() =>
    Array(OTP_LENGTH).fill(""),
  );
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  if (!email) return <Navigate to="/auth/register" replace />;

  const focusBox = (index: number) =>
    inputs.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]?.focus();

  // fills boxes starting at `start` with the digits in `value`; handles typing, SMS autofill and paste
  const fillFrom = (start: number, value: string) => {
    const incoming = value
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH - start)
      .split("");
    if (incoming.length === 0) return;
    setError(null);
    setDigits((prev) => {
      const next = [...prev];
      incoming.forEach((d, i) => (next[start + i] = d));
      return next;
    });
    focusBox(start + incoming.length);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      // clear this box, or if it's already empty, clear the previous one and move back
      const target = digits[index] ? index : index - 1;
      if (target < 0) return;
      setError(null);
      setDigits((prev) => prev.map((d, i) => (i === target ? "" : d)));
      focusBox(target);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusBox(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    fillFrom(index, e.clipboardData.getData("text"));
  };

  const code = digits.join("");
  const isComplete = code.length === OTP_LENGTH;

  const onSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
        await verifyOtp(email, code);
      clearPendingEmail();
      navigate("/auth/login", { replace: true });
    } catch (err) {
      setError(toApiError(err).message);
      focusBox(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resend = async () => {
    setDigits(Array(OTP_LENGTH).fill(""));
    setError(null);
    setSecondsLeft(RESEND_SECONDS);
    focusBox(0);
    try {
      await sendOtp(email);
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <AuthLayout
      heading="Almost there."
      pitch="One quick code to confirm it is really you, and your account is ready."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-7">
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[32px] leading-[1.2] font-bold tracking-[-0.64px] text-ink">
            Verify your email
          </h2>
          <p className="text-[15px] leading-[1.45] text-muted">
            Enter the {OTP_LENGTH}-digit code we sent to{" "}
            <span className="font-medium wrap-break-word text-ink">
              {email}
            </span>
            .
          </p>
        </div>

        <div
          className="flex justify-center gap-2 sm:gap-3"
          role="group"
          aria-label="Verification code"
        >
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              autoFocus={i === 0}
              maxLength={i === 0 ? OTP_LENGTH : 1}
              value={digit}
              aria-label={`Digit ${i + 1}`}
              aria-invalid={!!error}
              aria-describedby={error ? "otp-error" : undefined}
              onChange={(e) => fillFrom(i, e.target.value.slice(-OTP_LENGTH))}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={(e) => handlePaste(i, e)}
              onFocus={(e) => e.target.select()}
              className="h-16 w-full max-w-14 min-w-0 rounded-[10px] border border-line bg-white text-center text-2xl leading-none font-semibold text-ink caret-brand outline-none transition focus:border-[1.5px] focus:border-brand focus:bg-brand/7 aria-invalid:border-danger aria-invalid:focus:bg-danger/5"
            />
          ))}
        </div>

        {error && (
          <p
            id="otp-error"
            role="alert"
            className="-mt-3 text-center text-[13px] text-danger"
          >
            {error}
          </p>
        )}

        <p className="flex items-center justify-center gap-1.25 text-sm leading-[1.2] text-muted">
          Didn&apos;t get the code?
          {secondsLeft > 0 ? (
            <span className="font-semibold text-ink tabular-nums">
              Resend in {Math.floor(secondsLeft / 60)}:
              {String(secondsLeft % 60).padStart(2, "0")}
            </span>
          ) : (
            <button
              type="button"
              onClick={resend}
              className="font-semibold text-brand hover:underline"
            >
              Resend code
            </button>
          )}
        </p>

        <button
          type="submit"
          disabled={!isComplete || isSubmitting}
          className="w-full rounded-[10px] bg-brand px-5 py-3.75 text-[15px] leading-[1.2] font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Verifying..." : "Verify"}
        </button>

        <Link
          to="/auth/register"
          className="self-center text-sm leading-[1.2] font-semibold text-brand hover:underline"
        >
          Change email
        </Link>
      </form>
    </AuthLayout>
  );
}
