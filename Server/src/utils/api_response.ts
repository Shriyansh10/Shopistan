/*
 * Journal — src/utils/api_response.ts
 *
 * Before: untyped ApiResponse class with a single ok(res, message, data) helper sending
 *   200 { success: true, message, data }; failed tsc under strict mode.
 *
 * 2026-09-26 (Claude): Typed it with Express's Response and a generic data type. Added created() for 201
 *   and a general send() for any other success status. Response shape unchanged.
 *
 * 2026-09-26 (Claude): Converted from a class with static methods to plain named functions:
 *   sendSuccess(), sendOk(), sendCreated(). Same behaviour and response shape.
 *   Usage: import { sendCreated } from "../utils/api_response.js"; sendCreated(res, "User registered", user);
 *
 * 2026-10-09 (Claude): Added sendDeleted() for DELETE endpoints — 200 with the same { success, message, data }
 *   shape. Usage: sendDeleted(res, "Product removed from wishlist");
 */

import type { Response } from "express";

export function sendSuccess<T>(res: Response, statusCode: number, message: string, data: T | null = null) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendOk<T>(res: Response, message: string, data: T | null = null) {
  return sendSuccess(res, 200, message, data);
}

export function sendCreated<T>(res: Response, message: string, data: T | null = null) {
  return sendSuccess(res, 201, message, data);
}

export function sendDeleted<T>(res: Response, message: string, data: T | null = null) {
  return sendSuccess(res, 200, message, data);
}
