import { api } from "../lib/api";
import type { ApiSuccess } from "../lib/api_response";

export type ShippingAddress = {
  name: string;
  house_no: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
};

export type PaymentMethod = "cod" | "card" | "upi"; // same values as paymentMethodDTO on the server

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type Order = {
  _id: string;
  total_amount: number;
  shipping_address: ShippingAddress;
  payment_method: PaymentMethod;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  gateway_order_id?: string; // UPI / card only
  createdAt: string;
};

// what the payment gateway gives back when an online order is created (amount in cents)
export type GatewayOrder = { gatewayOrderId: string; amount: number; currency: string };

// proof of payment from the gateway; the server checks the signature
export type PaymentProof = { gatewayOrderId: string; gatewayPaymentId: string; signature: string };

// name and price are snapshots from checkout; product_id is populated with the current image
// (null if the product has since been deleted)
export type OrderItem = {
  _id: string;
  product_id: { _id: string; image: string } | null;
  product_name: string;
  quantity: number;
  unit_price: number;
};

export type OrderWithItems = Order & { items: OrderItem[] };

// payment is null for cash on delivery
export async function placeOrder(shippingAddress: ShippingAddress, paymentMethod: PaymentMethod) {
  const res = await api.post<ApiSuccess<{ order: Order; payment: GatewayOrder | null }>>("/order", {
    shippingAddress,
    paymentMethod,
  });
  return res.data.data;
}

export async function getMyOrders(offset: number, limit: number) {
  const res = await api.get<ApiSuccess<{ orders: OrderWithItems[]; total: number }>>("/order", {
    params: { offset, limit },
  });
  return res.data.data;
}

export async function getOrder(orderId: string) {
  const res = await api.get<ApiSuccess<{ order: Order; orderItems: OrderItem[] }>>(`/order/${orderId}`);
  return res.data.data;
}

// the fake gateway: "success" returns a payment proof, "failure" fails with 402 (like a declined card)
export async function mockPay(gatewayOrderId: string, outcome: "success" | "failure") {
  const res = await api.post<ApiSuccess<PaymentProof>>(`/payments/mock/${gatewayOrderId}`, { outcome });
  return res.data.data;
}

// sends the proof to our server → order becomes paid + confirmed (calling it twice is harmless)
export async function verifyPayment(orderId: string, proof: PaymentProof) {
  const res = await api.post<ApiSuccess<Order>>(`/order/${orderId}/verify-payment`, {
    gatewayPaymentId: proof.gatewayPaymentId,
    signature: proof.signature,
  });
  return res.data.data;
}

// a UPI / card order still waiting for its payment
export function needsPayment(order: Pick<Order, "payment_method" | "payment_status" | "order_status">) {
  return order.payment_method !== "cod" && order.payment_status !== "paid" && order.order_status === "pending";
}
