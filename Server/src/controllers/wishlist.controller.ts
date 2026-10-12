import type { Request, Response } from "express";
import {
  addItemToWishlistService,
  removeItemFromWishlistService,
  getWishListByUserIdService,
  checkIfProductInWishlistService
} from "../services/wishlist.service.js";
import { badRequest } from "../utils/api-error.js";
import { sendCreated, sendDeleted, sendOk } from "../utils/api_response.js";
import { getPagination } from "../utils/query.js";


const addItemToWishlistController = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const { productId } = req.params;

  if (!productId || typeof productId !== "string") {
    throw badRequest("Product ID is required");
  }

  const result = await addItemToWishlistService({ userId, productId });
  return sendCreated(res, "Product added to wishlist successfully", result);
};

const removeItemFromWishlistController = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const { productId } = req.params;

    if (!productId || typeof productId !== "string") {
        throw badRequest("Product ID is required");
    }

    const result = await removeItemFromWishlistService({ userId, productId });
    return sendDeleted(res, "Product removed from wishlist successfully", result);
};

const getWishListByUserIdController = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    // limit 1–50 (default 10), offset ≥ 0 (default 0); missing/invalid values fall back to the defaults
    const { offset, limit } = getPagination(req.query);

    const result = await getWishListByUserIdService(userId, offset, limit);
    return sendOk(res, "Wishlist fetched successfully", result);
}

const checkIfProductInWishlistController = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { productId } = req.params;

    if (!productId || typeof productId !== "string") {
        throw badRequest("Product ID is required");
    }

    const result = await checkIfProductInWishlistService(userId, productId);
    return sendOk(res, "Wishlist check completed successfully", result);
}

export { addItemToWishlistController, removeItemFromWishlistController, getWishListByUserIdController, checkIfProductInWishlistController };