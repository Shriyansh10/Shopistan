import { z } from "zod";

export const orderStatusDTO = z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]);
export const paymentStatusDTO = z.enum(["pending", "paid", "failed", "refunded"]);

export type OrderStatusType = z.infer<typeof orderStatusDTO>;
export type PaymentStatusType = z.infer<typeof paymentStatusDTO>;

export const updateOrderDTO = z
  .object({
    order_status: orderStatusDTO.optional(),
    payment_status: paymentStatusDTO.optional(),
  })
  .refine((body) => body.order_status || body.payment_status, {
    message: "Send order_status or payment_status",
  });

export type UpdateOrderType = z.infer<typeof updateOrderDTO>;
