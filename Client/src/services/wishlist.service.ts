/*
 * Journal — src/services/wishlist.service.ts
 *
 * 2026-10-09 (Claude): Created. Wishlist calls used by the product page (login required for both):
 *   isInWishlist(productId)   GET  /wishlist/item/:productId  → true/false
 *   addToWishlist(productId)  POST /wishlist/item/:productId  (no body; adding twice is harmless)
 *
 * 2026-10-09 (Claude): Added the calls for the /wishlist page:
 *   getWishlist(offset, limit)     GET    /wishlist?offset=&limit=  → { items, total } (newest saved first)
 *   removeFromWishlist(productId)  DELETE /wishlist/item/:productId
 *   Items have the same shape as Product ({ _id, name, image, price, discount, rating }).
 */

import { api } from "../lib/api";
import type { ApiSuccess } from "../lib/api_response";
import type { Product } from "./dashboard.service";

export type WishlistPage = {
  items: Product[];
  total: number;
};

export async function isInWishlist(productId: string) {
  const res = await api.get<ApiSuccess<boolean>>(`/wishlist/item/${productId}`);
  return res.data.data;
}

export async function addToWishlist(productId: string) {
  const res = await api.post<ApiSuccess<unknown>>(`/wishlist/item/${productId}`);
  return res.data;
}

export async function getWishlist(offset: number, limit: number) {
  const res = await api.get<ApiSuccess<WishlistPage>>("/wishlist", { params: { offset, limit } });
  return res.data.data;
}

export async function removeFromWishlist(productId: string) {
  const res = await api.delete<ApiSuccess<unknown>>(`/wishlist/item/${productId}`);
  return res.data;
}
