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
