import type { Request, Response } from "express";
import {
  getAllDepartmentsService,
  getAllCategoriesByDepartmentIdService,
  getAllProductsByCategoryIdService,
  searchProductsService,
} from "../services/dashboard.service.js";
import { badRequest } from "../utils/api-error.js";
import { sendOk } from "../utils/api_response.js";
import { getPagination, parseQuery } from "../utils/query.js";
import { productFiltersDto, searchProductsDto } from "../dto/product.dto.js";

const getAllDepartmentsController = async (req: Request, res: Response) => {
  const result = await getAllDepartmentsService();

  return sendOk(res, "Departments fetched successfully", result);
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
  return sendOk(res, "Categories fetched successfully", result);
};

const getAllProductsByCategoryIdController = async ( 
    req: Request,
    res: Response,
    ) => {

    const { categoryId } = req.params;

    if (!categoryId || typeof categoryId !== "string") {
        throw badRequest("Category ID is required");
    }

    // optional ?min_price= / ?max_price= / ?min_rating= / ?min_discount= (400 if invalid)
    const filters = parseQuery(productFiltersDto, req.query);
    const { offset, limit } = getPagination(req.query);

    const result = await getAllProductsByCategoryIdService(categoryId, filters, offset, limit);
    return sendOk(res, "Products fetched successfully", result);
};

const searchProductsController = async (req: Request, res: Response) => {
  // q + optional filters (400 if invalid)
  const searchFilters = parseQuery(searchProductsDto, req.query);
  // 10 per page by default (getPagination's default), max 50
  const { offset, limit } = getPagination(req.query);

  const data = await searchProductsService(searchFilters, offset, limit);
  return sendOk(res, "Products fetched successfully", data);
};


export {
  getAllDepartmentsController,
  getAllCategoriesByDepartmentIdController,
  getAllProductsByCategoryIdController,
  searchProductsController,
};
