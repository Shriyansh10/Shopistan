/*
 * Journal — src/app/(auth)/Register.tsx
 *
 * Before: empty placeholder component (lowercase `register`) returning "register".
 *
 * 2026-09-26 (Claude): Built the register page from the Figma design (node 24:2). react-hook-form + zodResolver
 *   (validates on blur), fields: full name, email, phone, password (Show/Hide toggle), terms checkbox.
 *   Per-field errors, root error banner for server failures, loading/disabled submit, link to /login.
 *   On success navigates to /login.
 *
 * 2026-09-26 (Claude): Full name split into First name / Last name side by side; phone split into a
 *   country code box (default +91) and a 10-digit number box. Name/phone inputs have maxLength from
 *   lib/limits.ts; password has no maxLength so the "8–50 characters" error can show.
 *
 * 2026-09-26 (Claude): Country code is now a <select> listing every country from lib/countries.ts,
 *   default India. The native select sits invisibly over a compact "🇮🇳 +91" label, so the closed box
 *   stays small while the open list shows full names. Selection is by ISO code; typing is impossible.
 *
 * 2026-09-26 (Claude): Phone input cap now uses PHONE_MAX_DIGITS (up to 10 digits, not exactly 10).
 *
 * 2026-09-26 (Claude): Submit errors now go through toApiError() (lib/api_error.ts), so server,
 *   timeout and offline failures all show a readable message in the error banner.
 *
 * 2026-09-27 (Claude): After a successful sign-up, navigates to /verify-otp (instead of /login) and
 *   passes the phone number in router state so the OTP page can show it.
 *
 * 2026-09-27 (Claude): Passes the email (where the OTP is sent) to /verify-otp instead of the phone,
 *   and also saves it via setPendingEmail() so the OTP page survives a refresh.
 *
 * 2026-09-29 (Claude): "Log in" link now points to /auth/login (was /login, which had no route).
 */

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import AuthLayout from "./AuthLayout";
import { registerSchema, type RegisterInput } from "../../schemas/auth.schema";
import { registerUser } from "../../services/auth.service";
import { toApiError } from "../../lib/api_error";
import type { VerifyOtpState } from "./VerifyOtp";
import { setPendingEmail } from "../../lib/pending_verification";
import { LIMITS } from "../../lib/limits";
import { COUNTRIES, DEFAULT_COUNTRY, flagEmoji, getCountry } from "../../lib/countries";

const inputClass =
  "w-full rounded-[10px] border border-line bg-white px-4 py-3.5 text-[15px] leading-[1.2] text-ink placeholder:text-muted outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-danger aria-invalid:focus:ring-danger/20";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-[13px] text-danger">
      {message}
    </p>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      first_name: "",
      last_name: "",
      email_id: "",
      country: DEFAULT_COUNTRY,
      phone_no: "",
      password: "",
      terms: false,
    },
  });

  const selectedCountry = getCountry(useWatch({ control, name: "country" }) ?? DEFAULT_COUNTRY);

  const onSubmit = async (data: RegisterInput) => {
    try {
      await registerUser(data);
      setPendingEmail(data.email_id);
      const state: VerifyOtpState = { email: data.email_id };
      navigate("/auth/verify-otp", { state });
    } catch (err) {
      setError("root", { message: toApiError(err).message });
    }
  };

  return (
    <AuthLayout
      heading="Join Shopistan."
      pitch="Create an account to track orders, save addresses and get your first delivery free."
    >
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[32px] leading-[1.2] font-bold tracking-[-0.64px] text-ink">
            Create your account
          </h2>
          <p className="text-[15px] leading-[1.45] text-muted">It only takes a minute.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="first_name" className="text-[13px] leading-none font-medium text-muted">
                First name
              </label>
              <input
                id="first_name"
                type="text"
                autoComplete="given-name"
                placeholder="Aarav"
                maxLength={LIMITS.NAME_MAX}
                aria-invalid={!!errors.first_name}
                className={inputClass}
                {...register("first_name")}
              />
              <FieldError message={errors.first_name?.message} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="last_name" className="text-[13px] leading-none font-medium text-muted">
                Last name
              </label>
              <input
                id="last_name"
                type="text"
                autoComplete="family-name"
                placeholder="Sharma"
                maxLength={LIMITS.NAME_MAX}
                aria-invalid={!!errors.last_name}
                className={inputClass}
                {...register("last_name")}
              />
              <FieldError message={errors.last_name?.message} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email_id" className="text-[13px] leading-none font-medium text-muted">
              Email
            </label>
            <input
              id="email_id"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email_id}
              className={inputClass}
              {...register("email_id")}
            />
            <FieldError message={errors.email_id?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="phone_no" className="text-[13px] leading-none font-medium text-muted">
              Phone number
            </label>
            <div className="grid grid-cols-[6.5rem_1fr] gap-3">
              <div
                className={`relative flex items-center justify-between gap-1 rounded-[10px] border bg-white px-3 text-[15px] text-ink transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 ${errors.country ? "border-danger" : "border-line"}`}
              >
                <span aria-hidden="true">
                  {flagEmoji(selectedCountry.iso)} {selectedCountry.dial}
                </span>
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" className="shrink-0 text-muted">
                  <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <select
                  id="country"
                  aria-label="Country code"
                  autoComplete="tel-country-code"
                  aria-invalid={!!errors.country}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  {...register("country")}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.iso} value={c.iso}>
                      {flagEmoji(c.iso)} {c.name} ({c.dial})
                    </option>
                  ))}
                </select>
              </div>
              <input
                id="phone_no"
                type="tel"
                inputMode="numeric"
                maxLength={LIMITS.PHONE_MAX_DIGITS}
                autoComplete="tel-national"
                placeholder="9876543210"
                aria-invalid={!!errors.phone_no}
                className={inputClass}
                {...register("phone_no")}
              />
            </div>
            <FieldError message={errors.country?.message ?? errors.phone_no?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[13px] leading-none font-medium text-muted">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a password"
                aria-invalid={!!errors.password}
                className={`${inputClass} pr-16`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-4 text-[13px] font-semibold text-brand"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <FieldError message={errors.password?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                aria-invalid={!!errors.terms}
                className="mt-px size-4.5 shrink-0 cursor-pointer rounded accent-brand"
                {...register("terms")}
              />
              <span className="text-[13px] leading-[1.45] text-muted">
                I agree to the Terms of Service and Privacy Policy.
              </span>
            </label>
            <FieldError message={errors.terms?.message} />
          </div>

          {errors.root && (
            <p role="alert" className="rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
              {errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-[10px] bg-brand px-5 py-3.75 text-[15px] leading-[1.2] font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="flex items-center justify-center gap-1.25 text-sm leading-[1.2] text-muted">
          Already have an account?
          <Link to="/auth/login" className="font-semibold text-brand hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
