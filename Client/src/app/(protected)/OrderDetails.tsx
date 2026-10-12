import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import OrderItemRow from "../../components/OrderItemRow";
import OrderStatusPill from "../../components/OrderStatusPill";
import { useAuth } from "../../context/auth.context";
import { toApiError, type ApiError } from "../../lib/api_error";
import { formatDate, orderNumber, paymentMethodLabel, usd } from "../../lib/format";
import { getOrder, needsPayment, type Order, type OrderItem } from "../../services/order.service";

const DELIVERY_TEXT: Record<Order["order_status"], string> = {
  pending: "Waiting for payment",
  confirmed: "Arrives in 3–5 days",
  shipped: "On its way",
  delivered: "Delivered",
  cancelled: "This order was cancelled",
};

function paymentLine(order: Order) {
  if (order.payment_status === "paid") return `Paid via ${paymentMethodLabel(order.payment_method)}`;
  if (order.payment_method === "cod") return "Cash on delivery · pay when it arrives";
  if (order.payment_status === "pending") return `${paymentMethodLabel(order.payment_method)} · waiting for payment`;
  return `${paymentMethodLabel(order.payment_method)} · payment ${order.payment_status}`;
}

function OrderBody({ order, items, justPlaced }: { order: Order; items: OrderItem[]; justPlaced: boolean }) {
  const { user } = useAuth();
  const a = order.shipping_address;

  return (
    <div className="mx-auto flex w-full max-w-140 flex-col gap-6">
      {justPlaced ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid size-19 place-items-center rounded-full bg-success/10">
            <span className="grid size-13 place-items-center rounded-full bg-success text-white">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
            </span>
          </span>
          <h1 className="text-[32px] leading-[1.2] font-bold tracking-[-0.8px]">Order placed successfully</h1>
          <p className="text-base leading-[1.45] text-muted">
            Thanks{user ? `, ${user.first_name}` : ""}. Your order is confirmed and on its way to being packed.
          </p>
        </div>
      ) : (
        <h1 className="text-[28px] leading-[1.2] font-bold tracking-[-0.56px]">Order details</h1>
      )}

      <p className={`flex flex-wrap gap-x-2 text-sm leading-[1.2] text-muted ${justPlaced ? "justify-center" : ""}`}>
        <span>
          Order <span className="font-semibold text-ink">{orderNumber(order._id)}</span>
        </span>
        <span>·</span>
        <span>{formatDate(order.createdAt)}</span>
      </p>

      <section className="flex flex-col gap-5 rounded-xl border border-line bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[15px] leading-[1.2] font-semibold">{DELIVERY_TEXT[order.order_status]}</span>
          <OrderStatusPill status={order.order_status} />
        </div>

        {items.map((item) => (
          <OrderItemRow
            key={item._id}
            name={item.product_name}
            quantity={item.quantity}
            lineTotal={Math.round(item.unit_price * item.quantity * 100) / 100}
            image={item.product_id?.image}
            productId={item.product_id?._id}
          />
        ))}

        <div className="h-px bg-line" />
        <div className="flex items-center justify-between text-[17px] leading-[1.2] font-bold">
          <span>{order.payment_status === "paid" ? "Total paid" : "Order total"}</span>
          <span>{usd.format(order.total_amount)}</span>
        </div>
        <p className="text-sm leading-[1.2] text-muted">{paymentLine(order)}</p>

        <div className="flex flex-col gap-1.5 rounded-[10px] bg-surface p-4">
          <span className="text-[11px] leading-[1.2] font-semibold tracking-[0.66px] text-subtle uppercase">Delivering to</span>
          <p className="text-sm leading-[1.5]">
            <span className="font-semibold">{a.name}</span>
            <br />
            {[a.house_no, a.address_line_1, a.address_line_2].filter(Boolean).join(", ")}
            <br />
            {a.city}, {a.state} {a.pincode}, {a.country}
          </p>
        </div>
      </section>

      {needsPayment(order) && (
        <Link
          to={`/pay/${order._id}`}
          className="rounded-[10px] bg-brand px-5.5 py-3.5 text-center text-[15px] leading-[1.2] font-semibold text-white transition hover:bg-brand-hover"
        >
          Complete payment  ·  {usd.format(order.total_amount)}
        </Link>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/orders"
          className="rounded-[10px] border border-ink bg-white px-5.5 py-3.5 text-[15px] leading-[1.2] font-semibold transition hover:bg-ink hover:text-white"
        >
          View all orders
        </Link>
        <Link
          to="/"
          // only one orange button: when "Complete payment" shows, this one is outlined
          className={`rounded-[10px] px-5.5 py-3.5 text-[15px] leading-[1.2] font-semibold transition ${
            needsPayment(order)
              ? "border border-line bg-white hover:border-ink"
              : "bg-brand text-white hover:bg-brand-hover"
          }`}
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderDetails() {
  const { orderId = "" } = useParams();
  const justPlaced = (useLocation().state as { justPlaced?: boolean } | null)?.justPlaced === true;
  const [data, setData] = useState<{ orderId: string; order: Order; items: OrderItem[] } | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let ignore = false;
    getOrder(orderId)
      .then(({ order, orderItems }) => !ignore && setData({ orderId, order, items: orderItems }))
      .catch((err) => !ignore && setError(toApiError(err)));
    return () => {
      ignore = true;
    };
  }, [orderId]);

  const current = data?.orderId === orderId ? data : null;
  const notFound = error && (error.statusCode === 404 || error.statusCode === 400);

  return (
    <div className="min-h-svh bg-white font-sans text-ink antialiased">
      <Header />

      <main className="px-4 pt-14 pb-20">
        {error ? (
          <div className="flex flex-col items-center py-10 text-center">
            <h1 className="text-3xl font-bold tracking-[-1px]">{notFound ? "Order not found" : "Something went wrong"}</h1>
            <p className="mt-3 text-muted">{notFound ? "We couldn't find this order in your account." : error.message}</p>
            <Link to="/orders" className="mt-8 rounded-[10px] bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-hover">
              Go to my orders
            </Link>
          </div>
        ) : current ? (
          <OrderBody order={current.order} items={current.items} justPlaced={justPlaced} />
        ) : (
          <div className="mx-auto flex max-w-140 animate-pulse flex-col gap-6">
            <div className="h-9 w-2/3 rounded bg-gray-100" />
            <div className="h-80 rounded-xl bg-gray-100" />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
