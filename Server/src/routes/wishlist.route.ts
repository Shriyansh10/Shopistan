import { Router } from "express";
import { addItemToWishlistController, removeItemFromWishlistController, checkIfProductInWishlistController, getWishListByUserIdController} from "../controllers/wishlist.controller.js";
import { requireAuthMiddleware } from "../middleware/auth.middleware.js";

const router: Router = Router();

router.post(
  "/item/:productId/",
  requireAuthMiddleware,
  addItemToWishlistController,
);
router.delete(
    "/item/:productId/",
    requireAuthMiddleware,
    removeItemFromWishlistController,
);
router.get(
    "/",
    requireAuthMiddleware,
    getWishListByUserIdController
);
router.get(
    "/item/:productId/",
    requireAuthMiddleware,
    checkIfProductInWishlistController
);

export default router;
