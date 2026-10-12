import mongoose from "mongoose";
import { Order, User } from "../models/index.js";
import { badRequest, conflict, notFound } from "../utils/api-error.js";
import { getAllOrdersByUserIdService } from "./order.service.js";
import type { OrderStatusType, PaymentStatusType, UpdateOrderType } from "../dto/admin.dto.js";

const ORDER_STATUS_NEXT: Record<OrderStatusType, OrderStatusType[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const PAYMENT_STATUS_NEXT: Record<PaymentStatusType, PaymentStatusType[]> = {
  pending: ["paid", "failed"],
  failed: ["paid"],
  paid: ["refunded"],
  refunded: [],
};

// "a.b" typed by the admin must not act as a regex
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getUsersService = async (search: string, offset: number, limit: number) => {
  const filter = search
    ? {
        $or: ["first_name", "last_name", "email_id"].map((field) => ({
          [field]: { $regex: escapeRegex(search), $options: "i" },
        })),
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("_id first_name last_name email_id phone_no role email_verified createdAt")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  // order count + money spent for every user on this page, in one query
  const stats = await Order.aggregate<{ _id: mongoose.Types.ObjectId; orderCount: number; totalSpent: number }>([
    { $match: { user_id: { $in: users.map((u) => u._id) } } },
    {
      $group: {
        _id: "$user_id",
        orderCount: { $sum: 1 },
        totalSpent: { $sum: { $cond: [{ $eq: ["$payment_status", "paid"] }, "$total_amount", 0] } },
      },
    },
  ]);
  const statsByUser = new Map(stats.map((s) => [s._id.toString(), s]));

  return {
    users: users.map((u) => {
      const s = statsByUser.get(u._id.toString());
      return {
        ...u,
        orderCount: s?.orderCount ?? 0,
        totalSpent: Math.round((s?.totalSpent ?? 0) * 100) / 100,
      };
    }),
    total,
  };
};

const getUserOrdersService = async (userId: string, offset: number, limit: number) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw badRequest("Invalid user ID");
  }

  const user = await User.findById(userId)
    .select("_id first_name last_name email_id phone_no role email_verified createdAt")
    .lean();
  if (!user) {
    throw notFound("User not found");
  }

  const { orders, total } = await getAllOrdersByUserIdService(userId, offset, limit);
  return { user, orders, total };
};

const updateOrderService = async (orderId: string, changes: UpdateOrderType) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw badRequest("Invalid order ID");
  }

  const order = await Order.findById(orderId).select("order_status payment_status").lean();
  if (!order) {
    throw notFound("Order not found");
  }

  const currentOrderStatus = order.order_status as OrderStatusType;
  const currentPaymentStatus = order.payment_status as PaymentStatusType;
  const update: Partial<Record<"order_status" | "payment_status", string>> = {};

  // sending the current value is a no-op, not an error
  if (changes.order_status && changes.order_status !== currentOrderStatus) {
    if (!ORDER_STATUS_NEXT[currentOrderStatus].includes(changes.order_status)) {
      throw badRequest(`Order status can't go from ${currentOrderStatus} to ${changes.order_status}`);
    }
    update.order_status = changes.order_status;
  }
  if (changes.payment_status && changes.payment_status !== currentPaymentStatus) {
    if (!PAYMENT_STATUS_NEXT[currentPaymentStatus].includes(changes.payment_status)) {
      throw badRequest(`Payment status can't go from ${currentPaymentStatus} to ${changes.payment_status}`);
    }
    update.payment_status = changes.payment_status;
  }

  // filter on the statuses we just checked, so a change made in between (e.g. the payment webhook) isn't overwritten
  const updated = await Order.findOneAndUpdate(
    { _id: orderId, order_status: currentOrderStatus, payment_status: currentPaymentStatus },
    { $set: update },
    { returnDocument: "after" },
  )
    .select("_id total_amount shipping_address payment_method order_status payment_status createdAt")
    .lean();

  if (!updated) {
    throw conflict("This order was just changed by someone else. Refresh and try again.");
  }
  return updated;
};

export { getUsersService, getUserOrdersService, updateOrderService };
