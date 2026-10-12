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
