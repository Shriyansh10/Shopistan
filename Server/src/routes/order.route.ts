import { Router } from "express";
import {
  createOrderServiceController,
  getAllOrdersByUserIdController,
  getOrderDetailsByIdController,
  verifyPaymentController,
} from "../controllers/order.controller.js";
import { requireAuthMiddleware } from "../middleware/auth.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { createOrderDTO } from "../dto/order.dto.js";
import { verifyPaymentDTO } from "../dto/payment.dto.js";

const router: Router = Router();

router.post(
  "/",
  requireAuthMiddleware,
  validateMiddleware(createOrderDTO),
  createOrderServiceController,
);
router.get("/", requireAuthMiddleware, getAllOrdersByUserIdController);
router.get("/:orderId", requireAuthMiddleware, getOrderDetailsByIdController);
router.post(
  "/:orderId/verify-payment",
  requireAuthMiddleware,
  validateMiddleware(verifyPaymentDTO),
  verifyPaymentController,
);


export default router;
