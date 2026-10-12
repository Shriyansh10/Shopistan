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

// what the admin form sends (same fields as productDto on the server; image is a link)
export type ProductInput = {
  name: string;
  image: string;
  price: number;
  discount: number;
  category_id: string;
  description?: string;
};

export type SavedProduct = ProductDetails["product"];

export async function createProduct(input: ProductInput) {
  const res = await api.post<ApiSuccess<SavedProduct>>("/products", input);
  return res.data.data;
}

export async function updateProduct(productId: string, input: ProductInput) {
  const res = await api.put<ApiSuccess<SavedProduct>>(`/products/${productId}`, input);
  return res.data.data;
}

export async function deleteProduct(productId: string) {
  await api.delete<ApiSuccess<null>>(`/products/${productId}`);
}
