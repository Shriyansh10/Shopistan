/*
 * Journal — src/services/dashboard.service.ts
 *
 * Before (user): public storefront services — all departments (seed order), categories of a department, and
 *   products of a category with offset/limit. The category and product queries were wrapped in try/catch that
 *   turned every error (including DB failures) into 400 "Invalid ... ID".
 *
 * 2026-10-08 (Claude): Removed the try/catch; ids are now checked up front with mongoose.isValidObjectId, so a
 *   malformed id gets a 400 and real errors reach the error handler (logged, 500). Products now return
 *   { products, total } — total comes from countDocuments, run in parallel with the page query. Removed unused
 *   imports (conflict, notFound, unauthorized, DepartmentType).
 */

import mongoose from "mongoose";
import Department from "../models/department.model.js";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import { badRequest } from "../utils/api-error.js";

const getAllDepartmentsService = async () => {
  const departments = await Department.find()
    .select("_id name slug image")
    .sort({ _id: 1 })
    .lean();

  return departments;
};

const getAllCategoriesByDepartmentIdService = async (departmentId: string) => {
  if (!mongoose.isValidObjectId(departmentId)) {
    throw badRequest("Invalid department ID");
  }

  const categories = await Category.find({ parent_id: departmentId })
    .sort({ _id: 1 })
    .lean();

  return categories;
};

const getAllProductsByCategoryIdService = async (
  categoryId: string,
  offset: number,
  limit: number,
) => {
  if (!mongoose.isValidObjectId(categoryId)) {
    throw badRequest("Invalid category ID");
  }

  // page of products + total count for "Showing X of Y" / Load more
  const [products, total] = await Promise.all([
    Product.find({ category_id: categoryId })
      .select("_id name image price discount rating")
      .sort({ _id: 1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Product.countDocuments({ category_id: categoryId }),
  ]);

  return { products, total };
};

export {
  getAllDepartmentsService,
  getAllCategoriesByDepartmentIdService,
  getAllProductsByCategoryIdService,
};
