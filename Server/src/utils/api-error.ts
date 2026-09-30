/*
 * Journal — src/utils/api-error.ts
 *
 * Before: untyped ApiError class (statusCode, isOperational = false) with a badRequest() helper that
 *   threw instead of returning; failed tsc under strict mode.
 *
 * 2026-09-26 (Claude): Typed the class and its fields. isOperational is now true — these are expected,
 *   safe-to-show errors (bad input, not found...), unlike bugs. Added an optional `errors` field for
 *   per-field details. Static helpers now RETURN the error so callers write `throw ApiError.notFound()`,
 *   and cover 400, 401, 403, 404, 409 and 500.
 *
 * 2026-09-26 (Claude): Converted to plain functions. createApiError() builds a normal Error (so throw
 *   still gives a stack trace) with statusCode / isOperational / errors attached. Helpers badRequest,
 *   unauthorized, forbidden, notFound, conflict, internalError return one; isApiError() replaces
 *   `instanceof ApiError` for the error handler.
 *   Usage: throw conflict("Email already registered");   if (isApiError(err)) res.status(err.statusCode)...
 */

export type ApiError = Error & {
  statusCode: number;
  isOperational: true;
  errors?: unknown;
};

export function createApiError(statusCode: number, message: string, errors?: unknown): ApiError {
  const error = new Error(message) as ApiError;
  error.name = "ApiError";
  error.statusCode = statusCode;
  error.isOperational = true;
  error.errors = errors;
  return error;
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof Error && (err as Partial<ApiError>).isOperational === true;
}

export const badRequest = (message = "Bad request", errors?: unknown) => createApiError(400, message, errors);
export const unauthorized = (message = "Unauthorized") => createApiError(401, message);
export const forbidden = (message = "Forbidden") => createApiError(403, message);
export const notFound = (message = "Not found") => createApiError(404, message);
export const conflict = (message = "Conflict") => createApiError(409, message);
export const internalError = (message = "Something went wrong") => createApiError(500, message);
