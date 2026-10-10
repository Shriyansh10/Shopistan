import { Router } from "express";
import {
  getProductDetailsByIdController,
  getAllProductReviewsByProductIdController,
  addProductReviewController,
} from "../controllers/product.controller.js";
import { requireAuthMiddleware } from "../middleware/auth.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { addReviewDto } from "../dto/product.dto.js";

const router: Router = Router();

router.get("/:productId", getProductDetailsByIdController);
router.get("/:productId/reviews", getAllProductReviewsByProductIdController);
router.post(
  "/:productId/reviews",
  requireAuthMiddleware,
  validateMiddleware(addReviewDto),
  addProductReviewController,
);

export default router;
