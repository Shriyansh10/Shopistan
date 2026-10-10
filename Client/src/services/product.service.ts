/*
 * Journal — src/services/product.service.ts
 *
 * 2026-10-09 (Claude): Created. Calls for the product page (routes live under /dashboard/product on the server):
 *   getProductDetails(id)            GET  /dashboard/product/:productId
 *   getProductReviews(id, off, lim)  GET  /dashboard/product/:productId/reviews?offset=&limit=  (newest first)
 *   addProductReview(id, body)       POST /dashboard/product/:productId/reviews  (login required)
 *   Types mirror Server/src/services/product.service.ts.
 */

import { api } from "../lib/api";
import type { ApiSuccess } from "../lib/api_response";

export type ProductDetails = {
  product: {
    _id: string;
    name: string;
    image: string;
    price: number; // original price
    discount: number; // % off
    rating: number; // 0–5
    description?: string;
    category_id: string;
  };
  category_details: { _id: string; name: string; parent_id: string | null };
  department_details: { _id: string; name: string } | null;
};

export type Review = {
  _id: string;
  // null if the reviewer's account was deleted
  user_id: { _id: string; first_name: string; last_name: string } | null;
  rating: number;
  comment?: string;
  createdAt: string;
};

export type ReviewPage = {
  reviews: Review[];
  total: number;
};

export type NewReview = {
  rating: number;
  comment?: string;
};

export async function getProductDetails(productId: string) {
  const res = await api.get<ApiSuccess<ProductDetails>>(`/dashboard/product/${productId}`);
  return res.data.data;
}

export async function getProductReviews(productId: string, offset: number, limit: number) {
  const res = await api.get<ApiSuccess<ReviewPage>>(`/dashboard/product/${productId}/reviews`, {
    params: { offset, limit },
  });
  return res.data.data;
}

export async function addProductReview(productId: string, review: NewReview) {
  const res = await api.post<ApiSuccess<unknown>>(`/dashboard/product/${productId}/reviews`, review);
  return res.data;
}
