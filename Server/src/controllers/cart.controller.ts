/*
 * Journal — src/controllers/cart.controller.ts
 *
 * Before (user): cart handlers — add, update quantity, remove, get cart, clear, count. User from the token,
 *   product from the URL, quantity from the body.
 *
 * 2026-10-10 (Claude): Removed the add/update `!quantity || typeof quantity !== "number"` checks — quantityDto
 *   on those routes already guarantees a whole number 1–10. quantity is now typed as QuantityType.
 */

import type { Request, Response } from "express";
import {
  addItemToCartService,
  removeItemFromCartService,
  getCartByUserIdService,
  removeAllItemsFromCartService,
  getCountOfItemsInCartService,
  updateItemToCartService,
} from "../services/cart.service.js";
import { badRequest } from "../utils/api-error.js";
import { sendCreated, sendDeleted, sendOk } from "../utils/api_response.js";
import type { QuantityType } from "../dto/cart.dto.js";

const addItemToCartController = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const { productId } = req.params;

  if (!productId || typeof productId !== "string") {
    throw badRequest("Product ID is required");
  }
  // validated by quantityDto: whole number 1–10
  const { quantity }: QuantityType = req.body;

  const result = await addItemToCartService({ userId, productId, quantity });
  return sendCreated(res, "Product added to cart successfully", result);
};

const updateItemToCartController = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { productId } = req.params;
    // validated by quantityDto: whole number 1–10
    const { quantity }: QuantityType = req.body;

    if (!userId || typeof userId !== "string") {
        throw badRequest("User ID is required");
    }
    if (!productId || typeof productId !== "string") {
        throw badRequest("Product ID is required");
    }

    const result = await updateItemToCartService({userId, productId, quantity });
    return sendOk(res, "Item quantity updated in cart successfully", result);
}

const removeItemFromCartController = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user!.id;

  const { productId } = req.params;

  if (!productId || typeof productId !== "string") {
    throw badRequest("Product ID is required");
  }
  if (!userId || typeof userId !== "string") {
    throw badRequest("User ID is required");
  }

  const result = await removeItemFromCartService({ userId, productId });
  return sendDeleted(res, "Product removed from cart successfully", result);
};

const getCartByUserIdController = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  if (!userId || typeof userId !== "string") {
    throw badRequest("User ID is required");
  }

  const result = await getCartByUserIdService(userId);
  return sendOk(res, "Cart fetched successfully", result);
};

const removeAllItemsFromCartController = async (
    req: Request,
    res: Response,
) => {
    const userId = req.user!.id;

    if (!userId || typeof userId !== "string") {
        throw badRequest("User ID is required");
    }

    const result = await removeAllItemsFromCartService(userId);
    return sendDeleted(res, "All items removed from cart successfully", result);
}

const getCountOfItemsInCartController = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    if (!userId || typeof userId !== "string") {
        throw badRequest("User ID is required");
    }

    const result = await getCountOfItemsInCartService(userId);
    return sendOk(res, "Count of items in cart fetched successfully", result);
}

export {
  addItemToCartController,
  removeItemFromCartController,
  getCartByUserIdController,
  removeAllItemsFromCartController,
  getCountOfItemsInCartController,
  updateItemToCartController,
};
