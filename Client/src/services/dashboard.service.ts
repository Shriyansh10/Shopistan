/*
 * Journal — src/services/dashboard.service.ts
 *
 * 2026-10-08 (Claude): Created. Public storefront calls for the department home page (no auth needed):
 *   getDepartments()              GET /dashboard/departments
 *   getCategories(departmentId)   GET /dashboard/departments/:id/categories
 *   getProducts(categoryId, ...)  GET /dashboard/categories/:categoryId/products?offset=&limit=
 *   Types mirror what Server/src/services/dashboard.service.ts returns (ids arrive as strings in JSON).
 */

import { api } from "../lib/api";
import type { ApiSuccess } from "../lib/api_response";

export type Department = {
  _id: string;
  name: string;
  slug: string;
  image?: string | null;
};

export type Category = {
  _id: string;
  name: string;
  parent_id: string;
};

export type Product = {
  _id: string;
  name: string;
  image: string;
  price: number; // original (list) price
  discount: number; // % off, 0 when not on sale
  rating: number; // 0–5
};

export type ProductPage = {
  products: Product[];
  total: number;
};

export async function getDepartments() {
  const res = await api.get<ApiSuccess<Department[]>>("/dashboard/departments");
  return res.data.data;
}

export async function getCategories(departmentId: string) {
  const res = await api.get<ApiSuccess<Category[]>>(`/dashboard/departments/${departmentId}/categories`);
  return res.data.data;
}

export async function getProducts(categoryId: string, offset: number, limit: number) {
  const res = await api.get<ApiSuccess<ProductPage>>(`/dashboard/categories/${categoryId}/products`, {
    params: { offset, limit },
  });
  return res.data.data;
}
