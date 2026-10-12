import { Router } from "express";
import {
  createProductController,
  updateProductController,
  deleteProductController,
} from "../controllers/product.controller.js";
import { requireAdminMiddleware, requireAuthMiddleware } from "../middleware/auth.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { productDto } from "../dto/product.dto.js";

const router: Router = Router();

router.use(requireAuthMiddleware, requireAdminMiddleware);

router.post("/", validateMiddleware(productDto), createProductController);
router.put("/:id", validateMiddleware(productDto), updateProductController);
router.delete("/:id", deleteProductController);

export default router;
