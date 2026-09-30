/*
 * Journal — src/app/(protected)/Profile.tsx
 *
 * 2026-09-30 (Claude): Created. Minimal page for testing the access/refresh token flow: loads the profile
 *   only when the "Fetch profile" button is clicked (GET /auth/profile), so you control exactly when
 *   each request fires (e.g. after the access token expires). Shows the profile, or the error's status code and message. Every call is also
 *   logged to the browser console. Not the final profile design.
 */

import { useState } from "react";
import { Link } from "react-router";
import { getProfile, type Profile as ProfileData } from "../../services/auth.service";
import { toApiError } from "../../lib/api_error";

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getProfile();
      console.log("Profile loaded:", res.data);
      setProfile(res.data);
    } catch (err) {
      const apiError = toApiError(err);
      console.error("Profile failed:", apiError.statusCode, apiError.message);
      setProfile(null);
      setError(`${apiError.statusCode} — ${apiError.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-white px-4 py-12 font-sans">
      <div className="flex w-full max-w-100 flex-col gap-6">
        <h1 className="text-[32px] leading-[1.2] font-bold tracking-[-0.64px] text-ink">Profile</h1>

        {profile && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-[10px] border border-line p-4 text-[15px]">
            <dt className="text-muted">Name</dt>
            <dd className="text-ink">
              {profile.first_name} {profile.last_name}
            </dd>
            <dt className="text-muted">Email</dt>
            <dd className="break-all text-ink">{profile.email_id}</dd>
            <dt className="text-muted">Phone</dt>
            <dd className="text-ink">{profile.phone_no ?? "—"}</dd>
          </dl>
        )}

        {error && (
          <p role="alert" className="rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={load}
          disabled={isLoading}
          className="w-full rounded-[10px] bg-brand px-5 py-3.75 text-[15px] leading-[1.2] font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Loading..." : "Fetch profile"}
        </button>

        <Link to="/auth/login" className="self-center text-sm font-semibold text-brand hover:underline">
          Back to log in
        </Link>
      </div>
    </main>
  );
}
