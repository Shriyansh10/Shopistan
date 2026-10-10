/*
 * Journal — src/services/product.service.ts
 *
 * Before (user): product services — details (product, then its category, then the department, as three
 *   hand-chained findById({ _id }) calls), paginated reviews of a product with total, and add a review.
 *
 * 2026-10-09 (Claude): Details now use one findById(productId) with a nested populate
 *   (category_id → parent_id) instead of chaining the lookups by hand. Still three queries under the hood
 *   (that's how populate works), but less code and no `{ _id: x }` passed to findById. Response shape is
 *   unchanged: { product, category_details, department_details }. Removed the now-unused Category and
 *   Department imports.
 *
 * 2026-10-09 (Claude): addProductReviewService no longer accepts `images` (photo upload is skipped for now);
 *   new reviews get the model's default images: [].
 */

import mongoose, { type Types } from "mongoose";
import Product from "../models/product.model.js";
import Review from "../models/review.model.js";
import { badRequest, notFound } from "../utils/api-error.js";

// shape of category_id after the nested populate in getProductDetailsByIdService
type PopulatedCategory = {
  _id: Types.ObjectId;
  name: string;
  parent_id: { _id: Types.ObjectId; name: string } | null;
};

const getProductDetailsByIdService = async (productId: string) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw badRequest("Invalid product ID");
  }

  // product → its category → that category's department, filled in by populate
  // (Mongoose still runs one query per level; populate just does the chaining for us)
  const product = await Product.findById(productId)
    .select("_id name image price discount rating description category_id")
    .populate<{ category_id: PopulatedCategory | null }>({
      path: "category_id",
      select: "name parent_id",
      populate: { path: "parent_id", select: "name" },
    })
    .lean();

  if (!product) {
    throw notFound("Product not found");
  }
  // populate gives null when the referenced category no longer exists
  const category = product.category_id;
  if (!category) {
    throw notFound("Category not found for the product");
  }

  // same response shape as before: product keeps the plain category id, details are split out
  const department_details = category.parent_id;
  return {
    product: { ...product, category_id: category._id },
    category_details: { _id: category._id, name: category.name, parent_id: department_details?._id ?? null },
    department_details,
  };
};

const getAllProductReviewsByProductIdService = async (
  productId: string,
  offset: number,
  limit: number,
) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw badRequest("Invalid product ID");
  }

  const [reviews, total] = await Promise.all([
    Review.find({ product_id: productId })
      .select("user_id rating comment createdAt")
      .populate({ path: "user_id", select: "first_name last_name" })
      .sort({ createdAt: -1 }) // newest first
      .skip(offset)
      .limit(limit)
      .lean(),
    Review.countDocuments({ product_id: productId }),
  ]);

  return { reviews, total };
};

const addProductReviewService = async (
  productId: string,
  userId: string,
  reviewData: {
    rating: number;
    comment?: string | undefined;
  },
) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw badRequest("Invalid product ID");
  }

  const existingReview = await Review.findOne({
    product_id: productId,
    user_id: userId,
  });
  if (existingReview) {
    throw badRequest("User has already reviewed this product");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw notFound("Product not found");
  }

  const review = new Review({
    product_id: productId,
    user_id: userId,
    ...reviewData,
  });

  await review.save();

  return review;
};

export {
  getProductDetailsByIdService,
  getAllProductReviewsByProductIdService,
  addProductReviewService,
};
