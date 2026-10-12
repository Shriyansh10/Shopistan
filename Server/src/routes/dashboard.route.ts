import { Router } from "express";
import {
  getAllDepartmentsController,
  getAllCategoriesByDepartmentIdController,
  getAllProductsByCategoryIdController,
  searchProductsController,
} from "../controllers/dashboard.controller.js";

const router: Router = Router();

router.get("/departments", getAllDepartmentsController);
router.get("/departments/:id/categories", getAllCategoriesByDepartmentIdController); 
router.get("/categories/:categoryId/products", getAllProductsByCategoryIdController); 
router.get("/products/search", searchProductsController);


export default router;
