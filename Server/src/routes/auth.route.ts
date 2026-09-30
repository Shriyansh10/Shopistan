/*
 * Journal — src/routes/auth.routes.ts
 *
 * Before: POST /register with an inline handler that logged the body, called validateMiddleware(registerDto)
 *   without using its result (so no validation ran), then called the controller with .then/.catch and
 *   built the 201/500 responses itself.
 *
 * 2026-09-26 (Claude): Route now only wires things up: validateMiddleware(registerDto) runs first, then
 *   the controller handles the request. Removed the body console.log (it printed passwords).
 */

import { Router } from "express";
import { loginDto, registerDto, sendOtpDto, verifyOtpDto} from "../dto/auth.dto.js";
import { getProfileController, loginUserWithEmailAndPasswordController, logoutController, refreshTokensController, registerUserUsingEmailAndPasswordController, sendOtpController, verifyOtpController } from "../controllers/auth.controller.js";
import {
  validateMiddleware,
} from "../middleware/validate.middleware.js";
import { requireAuthMiddleware } from "../middleware/auth.middleware.js";

const router: Router = Router();

router.post("/register", validateMiddleware(registerDto), registerUserUsingEmailAndPasswordController);
router.post("/send-otp", validateMiddleware(sendOtpDto), sendOtpController);
router.post("/verify-otp", validateMiddleware(verifyOtpDto), verifyOtpController);
router.post("/login", validateMiddleware(loginDto), loginUserWithEmailAndPasswordController);
router.get("/profile", requireAuthMiddleware, getProfileController);
router.post("/refresh-tokens", refreshTokensController);
router.post("/logout", logoutController);

export default router;
