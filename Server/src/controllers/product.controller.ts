import type { Request, Response } from "express";
import {
  getProductDetailsByIdService,
  getAllProductReviewsByProductIdService,
  addProductReviewService,
  createProductService,
  updateProductService,
  deleteProductService,
} from "../services/product.service.js";
import { badRequest } from "../utils/api-error.js";
import { sendCreated, sendDeleted, sendOk } from "../utils/api_response.js";
import { getPagination } from "../utils/query.js";
import type { AddReviewType, ProductType } from "../dto/product.dto.js";

const getProductDetailsByIdController = async (req: Request, res: Response) => {
  const { productId } = req.params;
  if (!productId || typeof productId !== "string") {
    throw badRequest("Product ID is required");
  }

  const result = await getProductDetailsByIdService(productId);

  return sendOk(res, "Product details fetched successfully", result);
};

const getAllProductReviewsByProductIdController = async (
  req: Request,
  res: Response,
) => {
  const { productId } = req.params;
  // limit 1–50 (default 10), offset ≥ 0 (default 0); missing/invalid values fall back to the defaults
  const { offset, limit } = getPagination(req.query);

  if (!productId || typeof productId !== "string") {
    throw badRequest("Product ID is required");
  }

  const result = await getAllProductReviewsByProductIdService(productId, offset, limit);

  return sendOk(res, "Product reviews fetched successfully", result);
};

const addProductReviewController = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { rating, comment }: AddReviewType = req.body;

  if (!productId || typeof productId !== "string") {
    throw badRequest("Product ID is required");
  }

  const userId = req.user?.id;

  const result = await addProductReviewService(productId, userId!, {
    rating,
    comment,
  });

  return sendCreated(res, "Product review added successfully", result);
};

const createProductController = async (req: Request, res: Response) => {
  // validated by productDto
  const data: ProductType = req.body;

  const product = await createProductService(data);
  return sendCreated(res, "Product created successfully", product);
};

const updateProductController = async (req: Request, res: Response) => {
  const { id } = req.params;
  // validated by productDto
  const data: ProductType = req.body;

  if (!id || typeof id !== "string") {
    throw badRequest("Product ID is required");
  }

  const product = await updateProductService(id, data);
  return sendOk(res, "Product updated successfully", product);
};

const deleteProductController = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    throw badRequest("Product ID is required");
  }

  await deleteProductService(id);
  return sendDeleted(res, "Product deleted successfully");
};

export {
  getProductDetailsByIdController,
  getAllProductReviewsByProductIdController,
  addProductReviewController,
  createProductController,
  updateProductController,
  deleteProductController,
};
