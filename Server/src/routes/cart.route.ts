import { Router } from "express";
import {
  addItemToCartController,
  removeItemFromCartController,
  getCartByUserIdController,
  removeAllItemsFromCartController,
  getCountOfItemsInCartController,
  updateItemToCartController,
} from "../controllers/cart.controller.js";
import { requireAuthMiddleware } from "../middleware/auth.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { quantityDto } from "../dto/cart.dto.js";

const router: Router = Router();

router.post(
  "/item/:productId/",
  requireAuthMiddleware,
  validateMiddleware(quantityDto),
  addItemToCartController,
);
router.delete(
  "/item/:productId/",
  requireAuthMiddleware,
  removeItemFromCartController,
);
router.get("/", requireAuthMiddleware, getCartByUserIdController);
router.put(
  "/item/:productId/",
  requireAuthMiddleware,
  validateMiddleware(quantityDto),
  updateItemToCartController,
);

router.delete("/", requireAuthMiddleware, removeAllItemsFromCartController);
router.get("/count", requireAuthMiddleware, getCountOfItemsInCartController)

export default router;
