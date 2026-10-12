import { api } from "../lib/api";
import type { ApiSuccess } from "../lib/api_response";
import type { ProductFilters } from "../lib/product_filters";

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
  selling_price?: number; // price after discount (what the customer pays and what the price filter uses)
  rating: number; // 0–5
};

// search results span categories, so each one carries its category (null if the category was deleted)
export type SearchProduct = Product & { category_id: { _id: string; name: string } | null };

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

// filters left undefined aren't sent (axios drops undefined params)
export async function getProducts(categoryId: string, offset: number, limit: number, filters: ProductFilters = {}) {
  const res = await api.get<ApiSuccess<ProductPage>>(`/dashboard/categories/${categoryId}/products`, {
    params: { ...filters, offset, limit },
  });
  return res.data.data;
}

export async function searchProducts(q: string, filters: ProductFilters, offset: number, limit: number) {
  const res = await api.get<ApiSuccess<{ products: SearchProduct[]; total: number }>>("/dashboard/products/search", {
    params: { q, ...filters, offset, limit },
  });
  return res.data.data;
}
