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
