import { z } from "zod";

// what the fake payment screen sends: did the user press "Pay" or "Fail"?
export const mockPaymentDTO = z.object({
  outcome: z.enum(["success", "failure"]),
});

export type MockPaymentType = z.infer<typeof mockPaymentDTO>;

// what the browser sends back after the gateway says "paid"
export const verifyPaymentDTO = z.object({
  gatewayPaymentId: z.string().trim().min(1).max(100),
  signature: z.string().trim().length(64), // HMAC-SHA256 as hex is always 64 characters
});

export type VerifyPaymentType = z.infer<typeof verifyPaymentDTO>;

// the parts of a Razorpay webhook we use (only checked after the signature is verified)
// order.paid     → payload.order.entity.id (gateway order) + payload.payment.entity.id (payment)
// payment.failed → payload.payment.entity.order_id
export const razorpayWebhookDTO = z.object({
  event: z.string(),
  payload: z.object({
    order: z.object({ entity: z.object({ id: z.string() }) }).optional(),
    payment: z
      .object({ entity: z.object({ id: z.string(), order_id: z.string().nullish() }) })
      .optional(),
  }),
});

export type RazorpayWebhookType = z.infer<typeof razorpayWebhookDTO>;
