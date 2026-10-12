import type { Request, Response } from "express";
import { verifyRazorpayWebhookSignature } from "../services/payment.service.js";
import { handleRazorpayWebhookService } from "../services/order.service.js";
import { razorpayWebhookDTO } from "../dto/payment.dto.js";
import { sendOk } from "../utils/api_response.js";
import { badRequest } from "../utils/api-error.js";

const razorpayWebhookController = async (req: Request, res: Response) => {
  const signature = req.get("x-razorpay-signature");
  // req.body is a Buffer here (express.raw on the route)
  const rawBody: unknown = req.body;

  if (!signature || !Buffer.isBuffer(rawBody) || !verifyRazorpayWebhookSignature(rawBody, signature)) {
    throw badRequest("Invalid webhook signature");
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw badRequest("Webhook body is not valid JSON");
  }

  const parsed = razorpayWebhookDTO.safeParse(json);
  if (!parsed.success) {
    console.warn("Razorpay webhook with an unexpected shape, ignored", parsed.error.issues);
    return sendOk(res, "Webhook ignored");
  }

  await handleRazorpayWebhookService(parsed.data);
  return sendOk(res, "Webhook received");
};

export { razorpayWebhookController };
