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
