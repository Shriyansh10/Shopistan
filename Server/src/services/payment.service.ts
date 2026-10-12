import crypto from "crypto";
import { badRequest, createApiError } from "../utils/api-error.js";
import type { MockPaymentType } from "../dto/payment.dto.js";
import Razorpay from "razorpay";

export type GatewayOrder = {
  gatewayOrderId: string;
  amount: number;
  currency: string;
};

export interface PaymentProvider {
  createPaymentOrder(amount: number, receipt: string): Promise<GatewayOrder>;
  verifySignature(
    gatewayOrderId: string,
    gatewayPaymentId: string,
    signature: string,
  ): boolean;
}

function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

// HMAC-SHA256(secret, `${gatewayOrderId}|${gatewayPaymentId}`) as hex — Razorpay's signature format
function hmacHex(
  secret: string,
  gatewayOrderId: string,
  gatewayPaymentId: string,
): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${gatewayOrderId}|${gatewayPaymentId}`)
    .digest("hex");
}

// compares two hex signatures in constant time
function isSameSignature(expectedHex: string, receivedHex: string): boolean {
  const expected = Buffer.from(expectedHex, "hex");
  const received = Buffer.from(receivedHex, "hex");
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

// the fake gateway signs with PAYMENT_SECRET
export function signPayment(
  gatewayOrderId: string,
  gatewayPaymentId: string,
): string {
  return hmacHex(readEnv("PAYMENT_SECRET"), gatewayOrderId, gatewayPaymentId);
}

export const mockProvider: PaymentProvider = {
  async createPaymentOrder(amount, receipt) {
    return {
      gatewayOrderId: `mock_order_${crypto.randomBytes(8).toString("hex")}`,
      amount: Math.round(amount * 100), // smallest unit: $28.35 → 2835 cents
      currency: "USD",
    };
  },
  verifySignature(gatewayOrderId, gatewayPaymentId, signature) {
    return isSameSignature(
      signPayment(gatewayOrderId, gatewayPaymentId),
      signature,
    );
  },
};

// --- Fake gateway (development only) — plays what Razorpay does when the user pays ---
export const mockGatewayPayService = (
  gatewayOrderId: string,
  outcome: MockPaymentType["outcome"],
) => {
  if (!gatewayOrderId.startsWith("mock_order_")) {
    throw badRequest("Unknown gateway order");
  }
  if (outcome === "failure") {
    throw createApiError(402, "Payment declined by the bank");
  }

  const gatewayPaymentId = `mock_pay_${crypto.randomBytes(8).toString("hex")}`;
  return {
    gatewayOrderId,
    gatewayPaymentId,
    signature: signPayment(gatewayOrderId, gatewayPaymentId),
  };
};

//Razorpay provider
// created on first use, so the mock keeps working when the Razorpay keys aren't set
let razorpay: Razorpay | null = null;
function getRazorpay(): Razorpay {
  razorpay ??= new Razorpay({
    key_id: readEnv("RAZORPAY_API_KEY"),
    key_secret: readEnv("RAZORPAY_API_SECRET"),
  });
  return razorpay;
}

export const razorpayProvider: PaymentProvider = {
  async createPaymentOrder(amount, receipt) {
    try {
      const order = await getRazorpay().orders.create({
        amount: Math.round(amount * 100), // smallest unit (paise)
        currency: "INR",
        receipt, // our order id, so Razorpay's dashboard links back to it
      });
      return {
        gatewayOrderId: order.id,
        amount: Number(order.amount),
        currency: order.currency,
      };
    } catch (err) {
      console.error("Razorpay order create failed", err);
      throw createApiError(
        502,
        "Payment gateway is unavailable, please try again",
      );
    }
  },
  // Razorpay signs exactly like our mock, with your key secret
  verifySignature(gatewayOrderId, gatewayPaymentId, signature) {
    return isSameSignature(
      hmacHex(readEnv("RAZORPAY_API_SECRET"), gatewayOrderId, gatewayPaymentId),
      signature,
    );
  },
};

export const paymentProvider: PaymentProvider =
  process.env.PAYMENT_PROVIDER === "razorpay" ? razorpayProvider : mockProvider;

// Razorpay webhooks: header X-Razorpay-Signature = HMAC-SHA256(webhook secret, raw request body) as hex.
// Must be the exact bytes Razorpay sent — parsing and re-stringifying the JSON would change them.
export function verifyRazorpayWebhookSignature(rawBody: Buffer, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", readEnv("RAZORPAY_WEBHOOK_SECRET"))
    .update(rawBody)
    .digest("hex");
  return isSameSignature(expected, signature);
}
