import { Router } from "express";
import {
  getUsersController,
  getUserOrdersController,
  updateOrderController,
} from "../controllers/admin.controller.js";
import { requireAdminMiddleware, requireAuthMiddleware } from "../middleware/auth.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { updateOrderDTO } from "../dto/admin.dto.js";

const router: Router = Router();

router.use(requireAuthMiddleware, requireAdminMiddleware);

router.get("/users", getUsersController);
router.get("/users/:userId/orders", getUserOrdersController);
router.patch("/orders/:orderId", validateMiddleware(updateOrderDTO), updateOrderController);

export default router;
