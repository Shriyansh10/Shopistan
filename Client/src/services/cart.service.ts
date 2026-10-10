/*
 * Journal — src/services/cart.service.ts
 *
 * 2026-10-10 (Claude): Created. Cart calls used by the /cart page (login required):
 *   getCart()                           GET    /cart  → { items, total, totalEstimatedPrice }
 *   updateCartQuantity(id, quantity)    PUT    /cart/item/:productId  { quantity }  (1–10; 404 if not in cart)
 *   removeFromCart(id)                  DELETE /cart/item/:productId
 *   Types mirror Server/src/services/cart.service.ts.
 *
 * 2026-10-10 (Claude): Added addToCart(id, quantity) — POST /cart/item/:productId { quantity }; returns the cart
 *   row so callers can see the resulting quantity (the server caps it at 10).
 *
 * 2026-10-10 (Claude): Added getCartCount() — GET /cart/count → total units, for the header badge.
 */

import { api } from "../lib/api";
import type { ApiSuccess } from "../lib/api_response";
import type { Product } from "./dashboard.service";

export type CartItem = Product & { quantity: number };

export type Cart = {
  items: CartItem[]; // newest added first
  total: number; // number of different products
  totalEstimatedPrice: number; // Σ selling price × quantity, rounded to cents
};

export async function getCart() {
  const res = await api.get<ApiSuccess<Cart>>("/cart");
  return res.data.data;
}

// total units in the cart (sum of quantities) — for the header badge
export async function getCartCount() {
  const res = await api.get<ApiSuccess<{ count: number }>>("/cart/count");
  return res.data.data.count;
}

// adds to what's already in the cart; the server caps the result at 10 and returns the saved row
export async function addToCart(productId: string, quantity: number) {
  const res = await api.post<ApiSuccess<{ item: { quantity: number } }>>(`/cart/item/${productId}`, { quantity });
  return res.data.data.item;
}

export async function updateCartQuantity(productId: string, quantity: number) {
  const res = await api.put<ApiSuccess<unknown>>(`/cart/item/${productId}`, { quantity });
  return res.data;
}

export async function removeFromCart(productId: string) {
  const res = await api.delete<ApiSuccess<unknown>>(`/cart/item/${productId}`);
  return res.data;
}
