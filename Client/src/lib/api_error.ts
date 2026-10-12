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
