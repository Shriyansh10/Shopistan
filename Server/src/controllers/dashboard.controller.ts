/*
 * Journal — src/controllers/dashboard.controller.ts
 *
 * Before (user): public storefront handlers — departments, categories by department id, and products by
 *   category id. Products read offset/limit straight from the query with Number(), so ?limit=0 (no limit in
 *   MongoDB), huge, negative, non-numeric or repeated values went through unchecked.
 *
 * 2026-10-08 (Claude): Added toInt() and clamped the products query: limit 1–50 (default 10), offset ≥ 0
 *   (default 0); invalid values fall back to the default. Products `data` is now { products, total }.
 */

import type { Request, Response } from "express";
import {
  getAllDepartmentsService,
  getAllCategoriesByDepartmentIdService,
  getAllProductsByCategoryIdService,
} from "../services/dashboard.service.js";

// Parses a query value as an integer ≥ min; anything else (missing, "abc", "-5", ?x=1&x=2) gives the fallback
const toInt = (value: unknown, fallback: number, min: number) => {
  const n = typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(n) && n >= min ? n : fallback;
};

const getAllDepartmentsController = async (req: Request, res: Response) => {
  const result = await getAllDepartmentsService();

  return res.status(200).json({
    success: true,
    message: "Departments fetched successfully",
    data: result,
  });
};

const getAllCategoriesByDepartmentIdController = async (
  req: Request,
  res: Response,
) => {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(400).json({
      success: false,
      message: "Department ID is required",
    });
  }

  const result = await getAllCategoriesByDepartmentIdService(id);
  return res.status(200).json({
    success: true,
    message: "Categories fetched successfully",
    data: result,
  });
};

const getAllProductsByCategoryIdController = async ( 
    req: Request,
    res: Response,
    ) => {

    const { categoryId } = req.params;

    if (!categoryId || typeof categoryId !== "string") {
        return res.status(400).json({
            success: false,
            message: "Category ID is required",
        });
    }

    // limit: 1–50 (default 10), offset: 0 or more (default 0); bad values fall back to the default
    const limit = Math.min(toInt(req.query.limit, 10, 1), 50);
    const offset = toInt(req.query.offset, 0, 0);

    const result = await getAllProductsByCategoryIdService(categoryId, offset, limit);
    return res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        data: result,
    });
};

export {
  getAllDepartmentsController,
  getAllCategoriesByDepartmentIdController,
  getAllProductsByCategoryIdController,
};
