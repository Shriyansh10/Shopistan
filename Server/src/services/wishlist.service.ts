/*
 * Journal — src/services/wishlist.service.ts
 *
 * Before (user): wishlist services — add (idempotent upsert), remove, list a user's wishlist (populated
 *   products, skipping deleted ones) and check whether a product is saved.
 *
 * 2026-10-09 (Claude): The list is now sorted newest-saved first and paginated (offset/limit), and returns
 *   { items, total } — total from countDocuments, run in parallel with the page query.
 */

import mongoose from "mongoose";
import Wishlist from "../models/wishlist.model.js";
import Product from "../models/product.model.js";
import { badRequest, notFound } from "../utils/api-error.js";

const addItemToWishlistService = async ({
  userId,
  productId,
}: {
  userId: string;
  productId: string;
}) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw badRequest("Invalid user ID");
  }
  if (!mongoose.isValidObjectId(productId)) {
    throw badRequest("Invalid product ID");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw notFound("Product not found");
  }

  const item = await Wishlist.findOneAndUpdate(
    { user_id: userId, product_id: productId },
    { $setOnInsert: { user_id: userId, product_id: productId } },
    { upsert: true, new: true },
  );
  if (!item) {
    throw badRequest("Failed to add product to wishlist");
  }
  return { item };
};

const removeItemFromWishlistService = async ({
  userId,
  productId,
}: {
  userId: string;
  productId: string;
}) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw badRequest("Invalid user ID");
  }
  if (!mongoose.isValidObjectId(productId)) {
    throw badRequest("Invalid product ID");
  }

  const item = await Wishlist.findOneAndDelete({
    user_id: userId,
    product_id: productId,
  });
  if (!item) {
    throw notFound("Product not found in wishlist");
  }
  return { item };
};

const getWishListByUserIdService = async (userId: string, offset: number, limit: number) => {
    if (!mongoose.isValidObjectId(userId)) {
        throw badRequest("Invalid user ID");
    }

    // one page (most recently saved first) + total count, in parallel
    const [wishlistItems, total] = await Promise.all([
      Wishlist.find({ user_id: userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate<{ product_id: { _id: string; name: string; image: string; price: number; discount: number; rating: number; } }>("product_id", "_id name image price discount rating")
        .lean(),
      Wishlist.countDocuments({ user_id: userId }),
    ]);

    const items = wishlistItems
      .filter((item) => item.product_id !== null)
      .map((item) => ({
        _id: item.product_id._id,
        name: item.product_id.name,
        image: item.product_id.image,
        price: item.product_id.price,
        discount: item.product_id.discount,
        rating: item.product_id.rating,
      }));

    return { items, total };
}

const checkIfProductInWishlistService = async (userId: string, productId: string) => {
    if (!mongoose.isValidObjectId(userId)) {
        throw badRequest("Invalid user ID");
    }
    if (!mongoose.isValidObjectId(productId)) {
        throw badRequest("Invalid product ID");
    }

    const item = await Wishlist.findOne({ user_id: userId, product_id: productId });
    return !!item; // returns true if item exists, false otherwise
}

export { addItemToWishlistService, removeItemFromWishlistService, getWishListByUserIdService, checkIfProductInWishlistService };
