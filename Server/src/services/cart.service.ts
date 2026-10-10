/*
 * Journal — src/services/cart.service.ts
 *
 * Before (user): cart services — add (upsert + $inc), update quantity, remove, get the whole cart with an
 *   estimated total (selling price × quantity), clear, and count. Adding could exceed 10 per product
 *   (only the amount added was capped, not the resulting total).
 *
 * 2026-10-10 (Claude): Add now clamps in one atomic step with an update pipeline:
 *   quantity = min(current + added, MAX_QUANTITY = 10). Needs updatePipeline: true in Mongoose 9.
 *   Replaced the deprecated `new: true` with returnDocument: "after" on that query.
 *
 * 2026-10-10 (Claude): Removed the quantity checks (whole number, > 0, > 10) from add and update — quantityDto
 *   on the routes already guarantees 1–10. Update now sets the quantity as given ($set: { quantity }).
 */

import mongoose from "mongoose";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import { badRequest, notFound } from "../utils/api-error.js";

const MAX_QUANTITY = 10; // per product in the cart

const addItemToCartService = async ({
  userId,
  productId,
  quantity,
}: {
  userId: string;
  productId: string;
quantity: number;
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
  // quantity is already a whole number 1–10 (quantityDto on the route)

  // one atomic step: new quantity = min(current + added, 10).
  // Update pipeline (array) so $min/$add can read the current value; on insert there is no current value
  // ($ifNull → 0) and user_id/product_id are filled in from the filter.
  const item = await Cart.findOneAndUpdate(
    { user_id: userId, product_id: productId },
    [{
        $set: {
          quantity: { $min: [{ $add: [{ $ifNull: ["$quantity", 0] }, quantity] }, MAX_QUANTITY] },
        },
    }],
    { upsert: true, returnDocument: "after", updatePipeline: true },
  );
  if (!item) {
    throw badRequest("Failed to add product to cart");
  }
  return { item };
};

const updateItemToCartService = async ({
  userId,
  productId,
  quantity,
}: {
  userId: string;
  productId: string;
  quantity: number;
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
  // quantity is already a whole number 1–10 (quantityDto on the route)

  const item = await Cart.findOneAndUpdate(
    { user_id: userId, product_id: productId },
    { $set: { quantity } },
    { upsert: false, returnDocument: "after" },
  );
  if (!item) {
    throw notFound("Item not found in cart");
  }
  return { item };
};

const removeItemFromCartService = async ({
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

  const item = await Cart.findOneAndDelete({
    user_id: userId,
    product_id: productId,
  });
  if (!item) {
    throw notFound("Product not found in cart");
  }
  return { item };
};

const getCartByUserIdService = async (userId: string) => {
    if (!mongoose.isValidObjectId(userId)) {
        throw badRequest("Invalid user ID");
    }

    const [cartItems, total] = await Promise.all([
      Cart.find({ user_id: userId })
        .sort({ createdAt: -1 })
        .select("product_id quantity") // only select the product_id and quantity fields
        .populate<{ product_id: { _id: string; name: string; image: string; price: number; discount: number; rating: number; } }>("product_id", "_id name image price discount rating")
        .lean(),
      Cart.countDocuments({ user_id: userId }),
    ]);

    let totalEstimatedPrice: number = 0;
    const items = cartItems
      .filter((item) => item.product_id !== null)
      .map((item) => {
        const sellingPrice = item.product_id.price * (1 - item.product_id.discount / 100);
        totalEstimatedPrice += sellingPrice * item.quantity;
        return {
        _id: item.product_id._id,
        name: item.product_id.name,
        image: item.product_id.image,
        price: item.product_id.price,
        discount: item.product_id.discount,
        rating: item.product_id.rating,
        quantity: item.quantity,
      };
    });

    totalEstimatedPrice = Math.round(totalEstimatedPrice * 100) / 100; // round to 2 decimal places
    return { items, total, totalEstimatedPrice };
}

const removeAllItemsFromCartService = async (userId: string) => {
    if (!mongoose.isValidObjectId(userId)) {
        throw badRequest("Invalid user ID");
    }

    const result = await Cart.deleteMany({ user_id: userId });
    return { deletedCount: result.deletedCount };
}

const getCountOfItemsInCartService = async (userId: string) => {
    if (!mongoose.isValidObjectId(userId)) {
        throw badRequest("Invalid user ID");
    }

    const items = await Cart.find({ user_id: userId });
    const count = items.reduce((acc, item) => acc + item.quantity, 0);
    return { count };
}


export {
  addItemToCartService,
  removeItemFromCartService,
  getCartByUserIdService,
  removeAllItemsFromCartService,
  getCountOfItemsInCartService,
  updateItemToCartService,
};