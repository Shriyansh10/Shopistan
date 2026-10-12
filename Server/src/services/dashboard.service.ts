import mongoose from "mongoose";
import Department from "../models/department.model.js";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import { badRequest } from "../utils/api-error.js";
import type { ProductFiltersType, SearchProductsType } from "../dto/product.dto.js";

// MongoDB conditions for the price / rating / discount filters; only the ones that were sent
const buildFilterConditions = ({ min_price, max_price, min_rating, min_discount }: ProductFiltersType) => {
  const conditions: Record<string, unknown> = {};
  if (min_price !== undefined || max_price !== undefined) {
    conditions.selling_price = {
      ...(min_price !== undefined && { $gte: min_price }),
      ...(max_price !== undefined && { $lte: max_price }),
    };
  }
  if (min_rating !== undefined) conditions.rating = { $gte: min_rating };
  if (min_discount !== undefined) conditions.discount = { $gte: min_discount };
  return conditions;
};

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
  filters: ProductFiltersType,
  offset: number,
  limit: number,
) => {
  if (!mongoose.isValidObjectId(categoryId)) {
    throw badRequest("Invalid category ID");
  }

  // the category + whichever filters were sent
  const filter = { category_id: categoryId, ...buildFilterConditions(filters) };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select("_id name image price discount selling_price rating")
      .sort({ _id: 1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),   // total respects the filters, so "Showing X of Y" stays right
  ]);

  return { products, total };
};

const searchProductsService = async (
  searchFilters: SearchProductsType,
  offset: number,
  limit: number,
) => {
  // $text must sit at the top level of the filter; the other filters are added only when sent
  const { q, ...filters } = searchFilters;
  const filter = { $text: { $search: q }, ...buildFilterConditions(filters) };

  const [products, total] = await Promise.all([
    Product.find(filter, { score: { $meta: "textScore" } }) // relevance score of each match
      .select("_id name image price discount selling_price rating category_id")
      .populate("category_id", "name") // results span categories; the card shows the category name
      .sort({ score: { $meta: "textScore" }, _id: 1 }) // most relevant first; _id keeps pages stable
      .skip(offset)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return { products, total };
};



export {
  getAllDepartmentsService,
  getAllCategoriesByDepartmentIdService,
  getAllProductsByCategoryIdService,
  searchProductsService,
};
