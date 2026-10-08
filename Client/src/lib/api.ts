/*
 * Journal — src/lib/api.ts
 *
 * 2026-09-26 (Claude): Created. Shared axios instance for every API call:
 *   baseURL = VITE_BACKEND_URL + "/api", withCredentials so the auth cookie is sent, 15s timeout.
 *   A response interceptor converts every failure into an ApiError (lib/api_error.ts), so callers
 *   can rely on err.message / err.statusCode. Usage: api.post<ApiSuccess<User>>("/auth/register", body)
 *
 * Later (user): removed the ApiError conversion from the response interceptor; it now logs the failed
 *   request and rejects with the raw axios error. Started a 401 branch with a `_retry` flag for token refresh.
 *
 * 2026-09-30 (Claude): Typed the error interceptor. `error` is now AxiosError (axios declares it as `any`,
 *   so nothing was checked). Added `_retry?: boolean` to InternalAxiosRequestConfig with module
 *   augmentation. error.config can be undefined, so the 401 branch checks for it first. Behaviour unchanged.
 *
 * 2026-10-08 (Claude): Removed the forced `window.location.href = "/auth/login"` when the token refresh fails.
 *   Guests browse public pages, and the session check (GET /auth/profile) runs for everyone, so the redirect
 *   bounced every guest to login. A failed refresh now just rejects; the RequireAuth route guard decides
 *   when login is needed (cart, wishlist, settings).
 */

import axios, { type AxiosError } from "axios";

// Our own flag on the request config: marks a request that was already retried after a token refresh,
// so a second 401 doesn't trigger another refresh.
declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
  withCredentials: true,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (
      originalRequest &&
      error.response?.status === 401 &&
      originalRequest.url !== "/auth/refresh-tokens" &&
      originalRequest.url !== "/auth/login"
    ) {
      if (originalRequest._retry) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      try {
        if (!refreshPromise)
          refreshPromise = api
            .post("/auth/refresh-tokens")
            .then(() => undefined)
            .finally(() => {
              refreshPromise = null;
            });

        await refreshPromise;
        return api(originalRequest);
      } catch (err) {
        // refresh failed → not logged in. No redirect here: guests may browse; RequireAuth guards protected pages
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  },
);
