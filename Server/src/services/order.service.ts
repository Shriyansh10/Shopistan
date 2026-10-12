import mongoose from "mongoose";
import { Order, Cart, OrderItem } from "../models/index.js";
import type {
  PaymentMethodType,
  ShippingAddressType,
} from "../dto/order.dto.js";
import { getSellingPrice, roundMoney } from "../utils/price.js";
import { badRequest, notFound } from "../utils/api-error.js";

import { paymentProvider, type GatewayOrder } from "./payment.service.js";
import type { RazorpayWebhookType } from "../dto/payment.dto.js";

// removes a half-created order and any of its items
const undoOrder = async (orderId: mongoose.Types.ObjectId) => {
  await OrderItem.deleteMany({ order_id: orderId });
  await Order.deleteOne({ _id: orderId });
};

const createOrderService = async ({
  userId,
  shippingAddress,
  paymentMethod,
}: {
  userId: string;
  shippingAddress: ShippingAddressType;
  paymentMethod: PaymentMethodType;
}) => {
  const cartRows = await Cart.find({ user_id: userId })
    .populate<{
      product_id: {
        _id: string;
        name: string;
        price: number;
        discount: number;
        selling_price?: number; // missing only on a product saved before the field existed
      } | null; // null when the product was deleted after being added to the cart
    }>("product_id", "_id name price discount selling_price")
    .lean();

  // price every line (no database writes yet); flatMap drops rows whose product no longer exists
  const lines = cartRows.flatMap((row) => {
    const product = row.product_id;
    if (!product) return [];
    return [
      {
        product_id: product._id,
        product_name: product.name,
        quantity: row.quantity,
        // the price shown and filtered on; calculated only if the product has none stored
        unit_price: product.selling_price ?? getSellingPrice(product.price, product.discount),
      },
    ];
  });

  if (lines.length === 0) {
    throw badRequest("Your cart is empty");
  }

  const totalAmount = roundMoney(
    lines.reduce((sum, line) => sum + line.unit_price * line.quantity, 0),
  );
  const isCod = paymentMethod === "cod";

  // new Order(...) already has its _id, so the items below can point at it
  const order = new Order({
    user_id: userId,
    total_amount: totalAmount,
    shipping_address: shippingAddress,
    payment_method: paymentMethod,
    order_status: isCod ? "confirmed" : "pending", // online methods wait for the payment step
    payment_status: "pending", // COD is paid on delivery
  });
  await order.save();

  let items;
  try {
    items = await OrderItem.insertMany(
      lines.map((line) => ({ ...line, order_id: order._id })),
    );
  } catch (err) {
    // undo: remove any items that did get in, then the order itself
    await undoOrder(order._id);
    throw err;
  }
  let payment: GatewayOrder | null = null;
  if (isCod) {
    try {
      await Cart.deleteMany({ user_id: userId });
    } catch (err) {
      // the order is placed; don't fail the request over the cart (a retry would create a duplicate order)
      console.error(
        `Order ${order._id}: placed, but clearing the cart failed`,
        err,
      );
    }
  } else {
    // UPI / card: ask the gateway for a payment order; the cart stays until the payment is verified
    try {
      payment = await paymentProvider.createPaymentOrder(
        totalAmount,
        order._id.toString(),
      );
      order.gateway_order_id = payment.gatewayOrderId;
      await order.save();
    } catch (err) {
      // without a gateway order this order can never be paid, so remove it
      await undoOrder(order._id);
      throw err;
    }
  }

  return { order, items, payment };
};

const getAllOrdersByUserIdService = async (
  userId: string,
  offset: number,
  limit: number,
) => {
  // one page of the user's orders (newest first) + how many they have in total, in parallel
  const [orders, total] = await Promise.all([
    Order.find({ user_id: userId })
      .select(
        "_id total_amount shipping_address payment_method order_status payment_status createdAt",
      )
      .sort({ createdAt: -1 }) // newest first
      .skip(offset)
      .limit(limit)
      .lean(),
    Order.countDocuments({ user_id: userId }),
  ]);

  // the items of every order on this page in ONE query (not one request per order), with the product image
  const allItems = await OrderItem.find({
    order_id: { $in: orders.map((o) => o._id) },
  })
    .select("order_id product_id product_name quantity unit_price")
    .populate("product_id", "_id image")
    .lean();

  // group them back under their order
  const itemsByOrder = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const key = item.order_id.toString();
    itemsByOrder.set(key, [...(itemsByOrder.get(key) ?? []), item]);
  }

  return {
    orders: orders.map((o) => ({
      ...o,
      items: itemsByOrder.get(o._id.toString()) ?? [],
    })),
    total,
  };
};

const getOrderDetailsByIdService = async (userId: string, orderId: string) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw badRequest("Invalid order ID");
  }

  const order = await Order.findOne({ _id: orderId, user_id: userId }).select(
    // gateway_order_id: the payment page needs it to pay an unpaid UPI / card order
    "_id total_amount shipping_address payment_method order_status payment_status gateway_order_id createdAt",
  );

  if (!order) {
    throw notFound("Order not found");
  }

  const orderItems = await OrderItem.find({ order_id: orderId })
    .select("product_id product_name quantity unit_price")
    .populate("product_id", "_id image")
    .lean();

  return { order, orderItems };
};

const verifyPaymentService = async ({
  userId,
  orderId,
  gatewayPaymentId,
  signature,
}: {
  userId: string;
  orderId: string;
  gatewayPaymentId: string;
  signature: string;
}) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw badRequest("Invalid order ID");
  }

  // only the user's own order
  const order = await Order.findOne({ _id: orderId, user_id: userId });
  if (!order) {
    throw notFound("Order not found");
  }

  // already verified (double click, page refresh) → nothing to do
  if (order.payment_status === "paid") {
    return order;
  }

  if (!order.gateway_order_id) {
    throw badRequest("This order has no online payment");
  }

  // check against the gateway order id WE saved, not one sent by the client
  const isValid = paymentProvider.verifySignature(
    order.gateway_order_id,
    gatewayPaymentId,
    signature,
  );
  if (!isValid) {
    throw badRequest("Payment could not be verified");
  }

  order.payment_status = "paid";
  order.order_status = "confirmed";
  order.gateway_payment_id = gatewayPaymentId;
  await order.save();

  await removeOrderedProductsFromCart(order._id, userId);

  return order;
};

// remove only the products that were in this order: the user may have added new things to the cart meanwhile
const removeOrderedProductsFromCart = async (
  orderId: mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId,
) => {
  try {
    const productIds = await OrderItem.distinct("product_id", { order_id: orderId });
    await Cart.deleteMany({ user_id: userId, product_id: { $in: productIds } });
  } catch (err) {
    // the payment is done; don't fail the request over the cart
    console.error(`Order ${orderId}: paid, but clearing the cart failed`, err);
  }
};

// Razorpay tells us about payments directly (also when the user closed the tab before verify-payment ran).
// Razorpay may send the same event more than once, so every update only applies once.
const handleRazorpayWebhookService = async ({ event, payload }: RazorpayWebhookType) => {
  if (event === "order.paid") {
    const gatewayOrderId = payload.order?.entity.id;
    const gatewayPaymentId = payload.payment?.entity.id;
    if (!gatewayOrderId || !gatewayPaymentId) return;

    // the filter on payment_status makes this a no-op if verify-payment (or an earlier delivery) already did it
    const order = await Order.findOneAndUpdate(
      { gateway_order_id: gatewayOrderId, payment_status: { $ne: "paid" } },
      {
        $set: {
          payment_status: "paid",
          order_status: "confirmed",
          gateway_payment_id: gatewayPaymentId,
        },
      },
      { returnDocument: "after" },
    );
    if (order) {
      await removeOrderedProductsFromCart(order._id, order.user_id);
    }
    return;
  }

  if (event === "payment.failed") {
    const gatewayOrderId = payload.payment?.entity.order_id;
    if (!gatewayOrderId) return;

    // only a still-pending order; never undo a payment that succeeded
    await Order.updateOne(
      { gateway_order_id: gatewayOrderId, payment_status: "pending" },
      { $set: { payment_status: "failed" } },
    );
  }
};


export {
  createOrderService,
  getAllOrdersByUserIdService,
  getOrderDetailsByIdService,
  verifyPaymentService,
  handleRazorpayWebhookService,
};
