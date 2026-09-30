/*
 * Journal — src/controllers/auth.controller.ts
 *
 * Before: registerUserUsingEmailAndPasswordController(userData) — a thin wrapper that took the DTO and
 *   returned the service result; the route did the req/res handling.
 *
 * 2026-09-26 (Claude): Controller is now the Express handler (req, res). Reads the already-validated
 *   body, calls the service and responds 201 via sendCreated(). Errors are not caught here — Express 5
 *   forwards errors thrown in async handlers to the error-handling middleware.
 *
 * 2026-09-30 (Claude): DRY refactor only. The access/refresh cookie-setting block, duplicated in the login
 *   and refresh controllers, moved into setAuthCookies(res, accessToken, refreshToken). Cookie names,
 *   options and behaviour are unchanged.
 */

import type { Request, Response } from "express";
import type { RegisterType } from "../dto/auth.dto.js";
import {
  clearRefreshTokenForUser,
  getProfileService,
  issueTokensForUser,
  loginUserWithEmailAndPasswordService,
  registerUserUsingEmailAndPasswordService,
  sendOtpService,
  validateRefreshTokenForUser,
  verifyOtpService,
} from "../services/auth.service.js";
import { sendCreated } from "../utils/api_response.js";
import { verifyRefreshToken } from "../utils/jwt.js";

// Sets the access and refresh token cookies (used by login and refresh)
const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  const isProd = process.env.mode === "production";
  const base = { httpOnly: true, secure: isProd, sameSite: "lax" as const };

  res.cookie("accessToken", accessToken, { ...base, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, {
    ...base,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
};

const registerUserUsingEmailAndPasswordController = async (
  req: Request,
  res: Response,
) => {
  const userData: RegisterType = req.body;
  const result = await registerUserUsingEmailAndPasswordService(userData);
  return sendCreated(res, "User registered successfully", result);
};

const sendOtpController = async (req: Request, res: Response) => {
  const { email_id } = req.body;
  await sendOtpService(email_id);
  return sendCreated(res, "OTP sent successfully");
};

const verifyOtpController = async (req: Request, res: Response) => {
  const { email_id, otp } = req.body;
  const isValid = await verifyOtpService(email_id, otp);
  if (isValid) {
    return sendCreated(res, "OTP verified successfully");
  } else {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }
};

const loginUserWithEmailAndPasswordController = async (
  req: Request,
  res: Response,
) => {
  const { email_id, password } = req.body;
  const { success, accessToken, refreshToken } =
    await loginUserWithEmailAndPasswordService(email_id, password);

  if (!success) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }

  setAuthCookies(res, accessToken, refreshToken);

  return sendCreated(res, "User logged in successfully");
};

const getProfileController = async (req: Request, res: Response) => {
  const user = req.user!;
  const profile = await getProfileService(user.id);
  return res.status(200).json({ success: true, data: profile });
};

const refreshTokensController = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res
      .status(403)
      .json({ success: false, message: "Refresh token missing" });
  }

  const { user_id } = verifyRefreshToken(refreshToken);

  await validateRefreshTokenForUser(refreshToken, user_id);

  try {
    const { accessToken, refreshToken: newRefreshToken } =
      await issueTokensForUser(user_id);

    setAuthCookies(res, accessToken, newRefreshToken);

    return res
      .status(200)
      .json({ success: true, message: "Tokens refreshed successfully" });
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid refresh token" });
  }
};

const logoutController = async (req: Request, res: Response) => {
  let user: { user_id: string } | null = null;
  try {
    user = verifyRefreshToken(req.cookies?.refreshToken);
    await clearRefreshTokenForUser(user?.user_id);
  } catch (error) {
    // Log the error if needed, but proceed to clear cookies anyway
  } finally {
    // Clear the cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken", { path: "/api/auth" });

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  }
};

export {
  registerUserUsingEmailAndPasswordController,
  sendOtpController,
  verifyOtpController,
  loginUserWithEmailAndPasswordController,
  getProfileController,
  refreshTokensController,
  logoutController,
};
