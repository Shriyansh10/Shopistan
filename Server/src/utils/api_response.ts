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
