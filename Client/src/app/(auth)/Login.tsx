/*
 * Journal — src/app/(auth)/Login.tsx
 *
 * Before: empty file.
 *
 * 2026-09-29 (Claude): Built the login page from the Figma design "Web / 01 — Log in" (node 8:17, brand
 *   panel 8:4). Uses AuthLayout ("Welcome back." pitch). react-hook-form + zodResolver (loginSchema,
 *   validates on blur): email, password with Show/Hide toggle, "Forgot password?" link, root error
 *   banner via toApiError(), loading/disabled submit, "or" divider, Continue with Google, link to sign up.
 *   Google sign-in and forgot-password aren't implemented yet — the Google button is disabled and the
 *   forgot link has no page behind it. On success navigates to "/" (no home route exists yet).
 *
 * 2026-09-30 (Claude): On success now navigates to /profile instead of "/" (which just bounced back here).
 *
 * 2026-10-08 (Claude): After login, refreshes the shared auth state (useAuth().refresh) so the header shows the
 *   user, then goes to ?next= (the page that asked for login, e.g. /cart) or "/" if there is none. next must be
 *   a same-site path ("/..." but not "//..."), so a crafted link can't send users to another website. Shows the
 *   message RequireAuth passes in router state ("Please sign in to continue.") above the form.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import AuthLayout from "./AuthLayout";
import { loginSchema, type LoginInput } from "../../schemas/auth.schema";
import { loginUser } from "../../services/auth.service";
import { toApiError } from "../../lib/api_error";
import { LIMITS } from "../../lib/limits";
import { useAuth } from "../../context/auth.context";

// only allow paths on this site: "/cart" yes, "//evil.com" or "https://evil.com" no
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

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

export default function Login() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [searchParams] = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const notice = (useLocation().state as { message?: string } | null)?.message;
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email_id: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await loginUser(data);
      await refresh(); // load the user into the shared auth state before leaving
      navigate(next, { replace: true });
    } catch (err) {
      setError("root", { message: toApiError(err).message });
    }
  };

  return (
    <AuthLayout
      heading="Welcome back."
      pitch="Your cart is right where you left it. Log in to pick up and check out in seconds."
    >
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[32px] leading-[1.2] font-bold tracking-[-0.64px] text-ink">
            Log in to Shopistan
          </h2>
          <p className="text-[15px] leading-[1.45] text-muted">Enter your details to continue.</p>
        </div>

        {notice && (
          <p role="status" className="rounded-[10px] bg-brand/10 px-4 py-3 text-sm text-ink">
            {notice}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email_id" className="text-[13px] leading-none font-medium text-muted">
              Email
            </label>
            <input
              id="email_id"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              maxLength={LIMITS.EMAIL_MAX}
              aria-invalid={!!errors.email_id}
              className={inputClass}
              {...register("email_id")}
            />
            <FieldError message={errors.email_id?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[13px] leading-none font-medium text-muted">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
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
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-[13px] leading-none text-muted">or</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <p className="flex items-center justify-center gap-1.25 text-sm leading-[1.2] text-muted">
          Don't have an account?
          <Link to="/auth/register" className="font-semibold text-brand hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
