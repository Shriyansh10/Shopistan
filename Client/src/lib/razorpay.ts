import type { PaymentMethod, PaymentProof } from "../services/order.service";

export const PAYMENT_PROVIDER: "razorpay" | "mock" =
  import.meta.env.VITE_PAYMENT_PROVIDER === "razorpay" ? "razorpay" : "mock";

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

// the parts of Razorpay's checkout.js API we use
type RazorpaySuccess = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayFailure = { error: { description?: string } };
type RazorpayOptions = {
  key: string;
  order_id: string; // the amount and currency come from this order
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string; method?: string };
  theme?: { color: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
};
type RazorpayCheckout = {
  open: () => void;
  on: (event: "payment.failed", callback: (response: RazorpayFailure) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout;
  }
}

// the user closed the popup without paying
export class PaymentCancelledError extends Error {
  constructor(message = "Payment cancelled") {
    super(message);
    this.name = "PaymentCancelledError";
  }
}

let scriptPromise: Promise<void> | null = null;

// adds checkout.js to the page the first time it's needed
function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null; // allow another try
      script.remove();
      reject(new Error("Couldn't open the payment window. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

type CheckoutInput = {
  gatewayOrderId: string;
  description: string;
  method: PaymentMethod; // opens the popup on UPI or card
  customer?: { name?: string; email?: string; phone?: string };
};

export async function openRazorpayCheckout({ gatewayOrderId, description, method, customer }: CheckoutInput) {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!key) throw new Error("VITE_RAZORPAY_KEY_ID is not set");

  await loadCheckoutScript();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("Couldn't open the payment window. Please try again.");

  return new Promise<PaymentProof>((resolve, reject) => {
    let lastFailure: string | undefined;

    const checkout = new Razorpay({
      key,
      order_id: gatewayOrderId,
      name: "Shopistan",
      description,
      prefill: {
        name: customer?.name,
        email: customer?.email,
        contact: customer?.phone?.replace("_", ""), // "+91_98765…" → "+9198765…"
        method,
      },
      theme: { color: "#ff6b2c" }, // brand orange
      handler: (response) =>
        resolve({
          gatewayOrderId: response.razorpay_order_id,
          gatewayPaymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }),
      modal: { ondismiss: () => reject(new PaymentCancelledError(lastFailure)) },
    });

    // the popup stays open so the user can retry; remember why it failed for when they close it
    checkout.on("payment.failed", (response) => {
      lastFailure = response.error.description;
    });

    checkout.open();
  });
}
