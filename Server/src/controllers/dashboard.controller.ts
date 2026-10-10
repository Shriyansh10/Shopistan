/*
 * Journal — src/controllers/dashboard.controller.ts
 *
 * Before (user): public storefront handlers — departments, categories by department id, and products by
 *   category id. Products read offset/limit straight from the query with Number(), so ?limit=0 (no limit in
 *   MongoDB), huge, negative, non-numeric or repeated values went through unchecked.
 *
 * 2026-10-08 (Claude): Added toInt() and clamped the products query: limit 1–50 (default 10), offset ≥ 0
 *   (default 0); invalid values fall back to the default. Products `data` is now { products, total }.
 *
 * 2026-10-09 (Claude): toInt() moved to utils/query.ts; the products handler now uses getPagination() from
 *   there (same rules), shared with the product-reviews endpoint.
 */

import type { Request, Response } from "express";
import {
  getAllDepartmentsService,
  getAllCategoriesByDepartmentIdService,
  getAllProductsByCategoryIdService,
} from "../services/dashboard.service.js";
import { badRequest } from "../utils/api-error.js";
import { sendCreated } from "../utils/api_response.js";
import { getPagination } from "../utils/query.js";

const getAllDepartmentsController = async (req: Request, res: Response) => {
  const result = await getAllDepartmentsService();

  return sendCreated(res, "Departments fetched successfully", result);
};

const getAllCategoriesByDepartmentIdController = async (
  req: Request,
  res: Response,
) => {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    throw badRequest("Department ID is required");
  }

  const result = await getAllCategoriesByDepartmentIdService(id);
  return sendCreated(res, "Categories fetched successfully", result);
};

const getAllProductsByCategoryIdController = async ( 
    req: Request,
    res: Response,
    ) => {

    const { categoryId } = req.params;

    if (!categoryId || typeof categoryId !== "string") {
        throw badRequest("Category ID is required");
    }

    const { offset, limit } = getPagination(req.query);

    const result = await getAllProductsByCategoryIdService(categoryId, offset, limit);
    return sendCreated(res, "Products fetched successfully", result);
};

export {
  getAllDepartmentsController,
  getAllCategoriesByDepartmentIdController,
  getAllProductsByCategoryIdController,
};
