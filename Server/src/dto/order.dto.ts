import { z } from "zod";

// trimmed, 1–255 characters
const requiredText = z.string().trim().min(1).max(255);

export const shippingAddressDTO = z.object({
  name: requiredText,
  house_no: requiredText,
  address_line_1: requiredText,
  address_line_2: z.string().trim().max(255).nullable().optional(),
  city: requiredText,
  state: requiredText,
  country: requiredText,
  pincode: requiredText,
});

export type ShippingAddressType = z.infer<typeof shippingAddressDTO>;

export const paymentMethodDTO = z.enum(["cod", "card", "upi"]);
export type PaymentMethodType = z.infer<typeof paymentMethodDTO>;

export const createOrderDTO = z.object({
  shippingAddress: shippingAddressDTO,
  paymentMethod: paymentMethodDTO,
});

export type CreateOrderType = z.infer<typeof createOrderDTO>;
