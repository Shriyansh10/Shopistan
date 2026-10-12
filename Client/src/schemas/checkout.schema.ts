import { z } from "zod";

const required = (label: string) =>
  z.string().trim().min(1, `Enter your ${label}`).max(255, `${label[0].toUpperCase()}${label.slice(1)} is too long`);

export const shippingAddressSchema = z.object({
  name: required("full name"),
  house_no: required("house / flat number"),
  address_line_1: required("address"),
  address_line_2: z.string().trim().max(255, "Address line 2 is too long").optional(),
  city: required("city"),
  state: required("state"),
  pincode: required("pincode"),
  country: required("country"),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
