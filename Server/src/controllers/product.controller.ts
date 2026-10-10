/*
 * Journal — src/controllers/product.controller.ts
 *
 * Before (user): product handlers — product details, paginated reviews of a product, and add a review
 *   (logged-in user, body validated by addReviewDto). Reviews passed Number(req.query.offset/limit) straight
 *   to the service, so missing values became NaN and ?offset=-1 crashed the query (500).
 *
 * 2026-10-09 (Claude): Reviews now use getPagination() from utils/query.ts — limit 1–50 (default 10),
 *   offset ≥ 0 (default 0); missing or invalid values fall back to the defaults.
 *
 * 2026-10-09 (Claude): Add-review no longer reads or passes `images` (removed from addReviewDto until photo
 *   upload exists).
 */

import type { Request, Response } from "express";
import {
  getProductDetailsByIdService,
  getAllProductReviewsByProductIdService,
  addProductReviewService,
} from "../services/product.service.js";
import { badRequest } from "../utils/api-error.js";
import { sendCreated, sendOk } from "../utils/api_response.js";
import { getPagination } from "../utils/query.js";
import type { AddReviewType } from "../dto/product.dto.js";

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

export {
  getProductDetailsByIdController,
  getAllProductReviewsByProductIdController,
  addProductReviewController,
};
