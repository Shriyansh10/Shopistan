/*
 * Journal — src/lib/api_response.ts
 *
 * 2026-09-26 (Claude): Created. Types for the server's response envelope, mirroring
 *   Server/src/utils/api_response.ts (success) and the error handler (failure):
 *   success → { success: true, message, data }, failure → { success: false, message, errors? }.
 */

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiFailure = {
  success: false;
  message: string;
  errors?: unknown;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
