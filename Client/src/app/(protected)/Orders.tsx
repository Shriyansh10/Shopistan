import { useEffect, useState } from "react";
import { Link } from "react-router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import OrderItemRow from "../../components/OrderItemRow";
import OrderStatusPill from "../../components/OrderStatusPill";
import { toApiError } from "../../lib/api_error";
import { formatDate, orderNumber, paymentMethodLabel, usd } from "../../lib/format";
import { getMyOrders, needsPayment, type OrderWithItems } from "../../services/order.service";

const PAGE_SIZE = 5;

function OrderCard({ order }: { order: OrderWithItems }) {
  const units = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-surface px-5 py-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[15px] leading-[1.2] font-semibold">Order {orderNumber(order._id)}</span>
            <OrderStatusPill status={order.order_status} />
          </div>
          <span className="text-[13px] leading-[1.3] text-muted">
            Placed {formatDate(order.createdAt)} · {units} {units === 1 ? "item" : "items"} · {paymentMethodLabel(order.payment_method)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-base leading-[1.25] font-bold">{usd.format(order.total_amount)}</span>
          <span className="text-xs leading-[1.2] text-muted">{order.payment_status === "paid" ? "Total paid" : "Order total"}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 py-5">
        {order.items.map((item) => (
          <OrderItemRow
            key={item._id}
            name={item.product_name}
            quantity={item.quantity}
            lineTotal={Math.round(item.unit_price * item.quantity * 100) / 100}
            image={item.product_id?.image}
            productId={item.product_id?._id}
          />
        ))}
        <div className="flex flex-wrap gap-3">
          {needsPayment(order) && (
            <Link
              to={`/pay/${order._id}`}
              className="inline-flex rounded-[9px] bg-brand px-4 py-2.5 text-[13px] leading-[1.2] font-semibold text-white transition hover:bg-brand-hover"
            >
              Complete payment
            </Link>
          )}
          <Link
            to={`/order/${order._id}`}
            className="inline-flex rounded-[9px] border border-line px-4 py-2.5 text-[13px] leading-[1.2] font-semibold transition hover:border-ink"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function Orders() {
  const [page, setPage] = useState<{ orders: OrderWithItems[]; total: number } | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getMyOrders(0, PAGE_SIZE)
      .then((result) => !ignore && setPage(result))
      .catch((err) => !ignore && setError(toApiError(err).message));
    return () => {
      ignore = true;
    };
  }, []);

  const loadMore = async () => {
    if (!page) return;
    setIsLoadingMore(true);
    try {
      const next = await getMyOrders(page.orders.length, PAGE_SIZE);
      setPage((prev) => prev && { orders: [...prev.orders, ...next.orders], total: next.total });
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const total = page?.total ?? 0;

  return (
    <div className="min-h-svh bg-white font-sans text-ink antialiased">
      <Header />

      <section className="mx-auto max-w-300 px-4 pt-8 xl:px-0">
        <div className="flex flex-col gap-1.5 leading-[1.2]">
          <h1 className="text-[28px] font-bold tracking-[-0.56px]">My orders</h1>
          <p className="text-sm text-muted">{page ? `${total} ${total === 1 ? "order" : "orders"}` : " "}</p>
        </div>
        {error && (
          <p role="alert" className="mt-5 rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
      </section>

      <main className="mx-auto flex max-w-300 flex-col gap-6 px-4 pt-7 pb-20 xl:px-0">
        {!page && !error &&
          [0, 1].map((i) => <div key={i} className="h-60 animate-pulse rounded-xl bg-gray-100" />)}

        {page && page.orders.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl bg-surface px-4 py-20 text-center">
            <h2 className="text-xl font-semibold">No orders yet</h2>
            <p className="mt-2 text-[15px] text-muted">When you place an order, it will show up here.</p>
            <Link
              to="/"
              className="mt-6 rounded-[10px] bg-brand px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-hover"
            >
              Continue shopping
            </Link>
          </div>
        )}

        {page?.orders.map((order) => <OrderCard key={order._id} order={order} />)}

        {page && page.orders.length > 0 && page.orders.length < page.total && (
          <div className="mt-6 flex flex-col items-center gap-3.5">
            <p className="text-sm text-muted">
              Showing {page.orders.length} of {page.total} orders
            </p>
            <button
              type="button"
              onClick={loadMore}
              disabled={isLoadingMore}
              className="h-11.5 rounded-[10px] border border-ink bg-white px-6 text-sm font-semibold transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
