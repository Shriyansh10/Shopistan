import { Router } from "express";
import { mockGatewayPayController } from "../controllers/payment.controller.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { mockPaymentDTO } from "../dto/payment.dto.js";

const router: Router = Router();

// fake payment gateway — no login: a real gateway doesn't know your users either
router.post(
  "/mock/:gatewayOrderId",
  validateMiddleware(mockPaymentDTO),
  mockGatewayPayController,
);

export default router;
