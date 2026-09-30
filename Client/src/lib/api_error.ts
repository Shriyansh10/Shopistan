/*
 * Journal — src/lib/api_error.ts
 *
 * 2026-09-26 (Claude): Created. Function-based client error, mirroring Server/src/utils/api-error.ts.
 *   toApiError() turns anything thrown by axios (or elsewhere) into one shape — an Error with
 *   statusCode and optional errors — so UI code only ever reads err.message / err.statusCode:
 *   - server replied        → server's `message`, HTTP status, `errors`
 *   - request timed out     → statusCode 408, "The server took too long to respond"
 *   - no response (offline) → statusCode 0, "Can't reach the server"
 *   - anything else         → statusCode 0, generic message
 */

import axios from "axios";
import type { ApiFailure } from "./api_response";

export type ApiError = Error & {
  statusCode: number;
  errors?: unknown;
};

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

export function createApiError(statusCode: number, message: string, errors?: unknown): ApiError {
  const error = new Error(message) as ApiError;
  error.name = "ApiError";
  error.statusCode = statusCode;
  error.errors = errors;
  return error;
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof Error && typeof (err as Partial<ApiError>).statusCode === "number";
}

export function toApiError(err: unknown): ApiError {
  if (isApiError(err)) return err;

  if (axios.isAxiosError<ApiFailure>(err)) {
    if (err.response) {
      const body = err.response.data;
      return createApiError(err.response.status, body?.message ?? FALLBACK_MESSAGE, body?.errors);
    }
    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      return createApiError(408, "The server took too long to respond. Please try again.");
    }
    return createApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  return createApiError(0, FALLBACK_MESSAGE);
}
