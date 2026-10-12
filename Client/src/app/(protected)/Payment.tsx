import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import CheckoutHeader from "../../components/CheckoutHeader";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/auth.context";
import { useCartCount } from "../../context/cart.context";
import { toApiError, type ApiError } from "../../lib/api_error";
import { orderNumber, paymentMethodLabel, usd } from "../../lib/format";
import { PAYMENT_PROVIDER, PaymentCancelledError, openRazorpayCheckout } from "../../lib/razorpay";
import { getOrder, mockPay, needsPayment, verifyPayment, type Order } from "../../services/order.service";

type Step = "idle" | "paying" | "verifying";

const isRazorpay = PAYMENT_PROVIDER === "razorpay";

const METHOD_TEXT: Record<string, string> = isRazorpay
  ? { upi: "Pay with any UPI app or UPI ID", card: "Visa, Mastercard, RuPay" }
  : { upi: "A collect request is sent to your UPI app", card: "Test card •••• 4242" };

export default function Payment() {
  const { orderId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCount } = useCartCount();
  const [data, setData] = useState<{ orderId: string; order: Order } | null>(null);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getOrder(orderId)
      .then(({ order }) => !ignore && setData({ orderId, order }))
      .catch((err) => !ignore && setLoadError(toApiError(err)));
    return () => {
      ignore = true;
    };
  }, [orderId]);

  const order = data?.orderId === orderId ? data.order : null;

  // nothing to pay (already paid, cash on delivery, cancelled) → show the order instead
  if (order && (!needsPayment(order) || !order.gateway_order_id)) {
    return <Navigate to={`/order/${order._id}`} replace />;
  }

  const pay = async (outcome: "success" | "failure") => {
    if (!order?.gateway_order_id) return;
    setPayError(null);
    setStep("paying");
    try {
      // 1. the gateway takes the money and hands back a signed proof
      const proof = isRazorpay
        ? await openRazorpayCheckout({
            gatewayOrderId: order.gateway_order_id,
            description: `Order ${orderNumber(order._id)}`,
            method: order.payment_method,
            customer: user
              ? { name: `${user.first_name} ${user.last_name}`, email: user.email_id, phone: user.phone_no }
              : undefined,
          })
        : await mockPay(order.gateway_order_id, outcome);
      // 2. our server checks the proof and marks the order paid
      setStep("verifying");
      await verifyPayment(order._id, proof);
      void refreshCount(); // the ordered products left the cart
      navigate(`/order/${order._id}`, { replace: true, state: { justPlaced: true } });
    } catch (err) {
      if (err instanceof PaymentCancelledError) {
        setPayError(`${err.message}. No money was taken. You can try again.`);
      } else {
        const apiError = toApiError(err);
        setPayError(
          apiError.statusCode === 402
            ? "Payment declined by the bank. No money was taken. You can try again."
            : apiError.message,
        );
      }
      setStep("idle");
    }
  };

  const busy = step !== "idle";
  // orders placed while the mock gateway was on have a fake gateway order that Razorpay doesn't know
  const madeWithMock = isRazorpay && !!order?.gateway_order_id?.startsWith("mock_order_");
  const notFound = loadError && (loadError.statusCode === 404 || loadError.statusCode === 400);

  return (
    <div className="min-h-svh bg-surface font-sans text-ink antialiased">
      <CheckoutHeader />

      <main className="px-4 pt-12 pb-20">
        {loadError ? (
          <div className="flex flex-col items-center py-10 text-center">
            <h1 className="text-3xl font-bold tracking-[-1px]">{notFound ? "Order not found" : "Something went wrong"}</h1>
            <p className="mt-3 text-muted">{notFound ? "We couldn't find this order in your account." : loadError.message}</p>
            <Link to="/orders" className="mt-8 rounded-[10px] bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-hover">
              Go to my orders
            </Link>
          </div>
        ) : !order ? (
          <div className="mx-auto h-110 max-w-110 animate-pulse rounded-2xl bg-gray-100" />
        ) : (
          <div className="mx-auto flex max-w-110 flex-col gap-4">
            {!isRazorpay && (
              <p className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-[1.45] text-amber-800">
                <span className="font-semibold">Test mode.</span> This is a mock payment gateway — no real money is charged.
              </p>
            )}

            <section className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span className="text-[13px] leading-[1.2] font-medium text-muted">Pay Shopistan</span>
                <span className="text-[34px] leading-[1.15] font-bold tracking-[-0.8px]">{usd.format(order.total_amount)}</span>
                <span className="text-[13px] leading-[1.2] text-muted">Order {orderNumber(order._id)}</span>
              </div>

              <div className="h-px bg-line" />

              <div className="flex flex-col gap-1 rounded-[10px] bg-surface px-4 py-3.5">
                <span className="text-sm leading-[1.2] font-semibold">{paymentMethodLabel(order.payment_method)}</span>
                <span className="text-[13px] leading-[1.3] text-muted">{METHOD_TEXT[order.payment_method]}</span>
              </div>

              {madeWithMock && (
                <p role="alert" className="rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
                  This order was created with the test payment gateway and can't be paid here. Please place it again
                  from your cart.
                </p>
              )}

              {payError && (
                <p role="alert" className="rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
                  {payError}
                </p>
              )}

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => pay("success")}
                  disabled={busy || madeWithMock}
                  className="w-full rounded-[10px] bg-brand px-5.5 py-3.5 text-[15px] leading-[1.2] font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {step === "paying"
                    ? isRazorpay
                      ? "Complete the payment in the popup..."
                      : "Processing payment..."
                    : step === "verifying"
                      ? "Confirming your order..."
                      : `${payError ? "Try again" : "Pay"}  ·  ${usd.format(order.total_amount)}`}
                </button>
                {isRazorpay ? (
                  <p className="text-center text-xs leading-[1.3] text-subtle">Payments are processed securely by Razorpay</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => pay("failure")}
                    disabled={busy}
                    className="w-full rounded-[10px] border border-line bg-white px-5.5 py-3 text-sm leading-[1.2] font-semibold text-muted transition hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Simulate a failed payment
                  </button>
                )}
              </div>
            </section>

            <p className="text-center text-[13px] leading-[1.5] text-muted">
              Not now?{" "}
              <Link to={`/order/${order._id}`} replace className="font-semibold text-brand hover:text-brand-hover">
                Pay later
              </Link>{" "}
              — your order waits for payment and stays in My orders.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
