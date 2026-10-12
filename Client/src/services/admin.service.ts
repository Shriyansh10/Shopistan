import { api } from "../lib/api";
import type { ApiSuccess } from "../lib/api_response";
import type { Order, OrderStatus, OrderWithItems, PaymentStatus } from "./order.service";

export type AdminUser = {
  _id: string;
  first_name: string;
  last_name: string;
  email_id: string;
  phone_no?: string;
  role: "user" | "admin";
  email_verified: boolean;
  createdAt: string;
};

// in the users list: plus how many orders they placed and how much they paid in total
export type AdminUserRow = AdminUser & { orderCount: number; totalSpent: number };

export const ORDER_STATUS_NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export const PAYMENT_STATUS_NEXT: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ["paid", "failed"],
  failed: ["paid"],
  paid: ["refunded"],
  refunded: [],
};

export async function getUsers(search: string, offset: number, limit: number) {
  const res = await api.get<ApiSuccess<{ users: AdminUserRow[]; total: number }>>("/admin/users", {
    params: { search: search || undefined, offset, limit },
  });
  return res.data.data;
}

export async function getUserOrders(userId: string, offset: number, limit: number) {
  const res = await api.get<ApiSuccess<{ user: AdminUser; orders: OrderWithItems[]; total: number }>>(
    `/admin/users/${userId}/orders`,
    { params: { offset, limit } },
  );
  return res.data.data;
}

export async function updateOrder(
  orderId: string,
  changes: { order_status?: OrderStatus; payment_status?: PaymentStatus },
) {
  const res = await api.patch<ApiSuccess<Order>>(`/admin/orders/${orderId}`, changes);
  return res.data.data;
}
