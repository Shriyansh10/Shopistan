import { useEffect, useState } from "react";
import Header from "../../components/Header";
import OrderItemRow from "../../components/OrderItemRow";
import OrderStatusPill from "../../components/OrderStatusPill";
import { toApiError } from "../../lib/api_error";
import { formatDate, initials, orderNumber, paymentMethodLabel, usd } from "../../lib/format";
import {
  getUserOrders,
  getUsers,
  ORDER_STATUS_NEXT,
  PAYMENT_STATUS_NEXT,
  updateOrder,
  type AdminUser,
  type AdminUserRow,
} from "../../services/admin.service";
import type { OrderStatus, OrderWithItems, PaymentStatus } from "../../services/order.service";

const USERS_PAGE_SIZE = 20;
const ORDERS_PAGE_SIZE = 5;

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

const selectClass =
  "h-10 w-full rounded-[9px] border border-line bg-white px-3 text-[13px] font-medium transition hover:border-ink focus:border-ink focus:outline-none disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted disabled:hover:border-line";

const loadMoreClass =
  "h-10 rounded-[10px] border border-ink bg-white px-5 text-[13px] font-semibold transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

function ErrorBox({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
      {message}
    </p>
  );
}

/* ---------------------------------- users ---------------------------------- */

function UsersPanel({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState<{ users: AdminUserRow[]; total: number } | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // first page; re-runs 300ms after the admin stops typing
  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      setError(null);
      getUsers(search.trim(), 0, USERS_PAGE_SIZE)
        .then((result) => !ignore && setPage(result))
        .catch((err) => !ignore && setError(toApiError(err).message));
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [search]);

  const loadMore = async () => {
    if (!page) return;
    setIsLoadingMore(true);
    try {
      const next = await getUsers(search.trim(), page.users.length, USERS_PAGE_SIZE);
      setPage((prev) => prev && { users: [...prev.users, ...next.users], total: next.total });
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <aside className="flex flex-col overflow-hidden rounded-xl border border-line bg-white lg:sticky lg:top-24 lg:max-h-[calc(100svh-120px)]">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Users</h2>
          <span className="text-[13px] text-muted">{page ? page.total : " "}</span>
        </div>
        <label className="flex h-10 items-center gap-2 rounded-[10px] border border-line bg-surface px-3 text-sm text-subtle focus-within:border-ink">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            aria-label="Search users"
            className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-subtle"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto">
        {error && <div className="p-4"><ErrorBox message={error} /></div>}

        {!page && !error && (
          <div className="flex flex-col gap-2 p-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        )}

        {page && page.users.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted">No users found.</p>
        )}

        <ul>
          {page?.users.map((u) => {
            const isSelected = u._id === selectedId;
            return (
              <li key={u._id}>
                <button
                  type="button"
                  onClick={() => onSelect(u._id)}
                  aria-current={isSelected ? "true" : undefined}
                  className={`flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition ${isSelected ? "bg-brand/8" : "hover:bg-surface"}`}
                >
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold ${isSelected ? "bg-brand text-white" : "bg-gray-100 text-ink"}`}>
                    {initials(u.first_name, u.last_name)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{u.first_name} {u.last_name}</span>
                      {u.role === "admin" && (
                        <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold tracking-[0.4px] text-white uppercase">Admin</span>
                      )}
                    </span>
                    <span className="truncate text-xs text-muted">{u.email_id}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-[13px] font-semibold">{usd.format(u.totalSpent)}</span>
                    <span className="text-xs text-muted">{u.orderCount} {u.orderCount === 1 ? "order" : "orders"}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {page && page.users.length < page.total && (
          <div className="flex justify-center p-4">
            <button type="button" onClick={loadMore} disabled={isLoadingMore} className={loadMoreClass}>
              {isLoadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ---------------------------------- orders --------------------------------- */

function AdminOrderCard({ order, onUpdated }: { order: OrderWithItems; onUpdated: (order: OrderWithItems) => void }) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const units = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const address = order.shipping_address;

  const save = async (changes: { order_status?: OrderStatus; payment_status?: PaymentStatus }) => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateOrder(order._id, changes);
      onUpdated({ ...order, order_status: updated.order_status, payment_status: updated.payment_status });
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsSaving(false);
    }
  };

  const orderOptions = [order.order_status, ...ORDER_STATUS_NEXT[order.order_status]];
  const paymentOptions = [order.payment_status, ...PAYMENT_STATUS_NEXT[order.payment_status]];

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
          <span className="text-xs leading-[1.2] text-muted">Payment: {PAYMENT_STATUS_LABELS[order.payment_status]}</span>
        </div>
      </div>

      <div className="grid gap-6 px-5 py-5 md:grid-cols-[1fr_220px]">
        <div className="flex flex-col gap-4">
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
          <div className="text-[13px] leading-[1.45] text-muted">
            <p className="font-semibold text-ink">Ship to {address.name}</p>
            <p>
              {address.house_no}, {address.address_line_1}
              {address.address_line_2 ? `, ${address.address_line_2}` : ""}
            </p>
            <p>{address.city}, {address.state} {address.pincode}, {address.country}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">Order status</span>
            <select
              value={order.order_status}
              onChange={(e) => save({ order_status: e.target.value as OrderStatus })}
              disabled={isSaving || orderOptions.length === 1}
              className={selectClass}
            >
              {orderOptions.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">Payment status</span>
            <select
              value={order.payment_status}
              onChange={(e) => save({ payment_status: e.target.value as PaymentStatus })}
              disabled={isSaving || paymentOptions.length === 1}
              className={selectClass}
            >
              {paymentOptions.map((s) => <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>)}
            </select>
          </label>
          {isSaving && <p className="text-xs text-muted">Saving...</p>}
          {error && <p role="alert" className="text-xs text-danger">{error}</p>}
        </div>
      </div>
    </article>
  );
}

function UserOrdersPanel({ userId }: { userId: string }) {
  const [page, setPage] = useState<{ user: AdminUser; orders: OrderWithItems[]; total: number } | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getUserOrders(userId, 0, ORDERS_PAGE_SIZE)
      .then((result) => !ignore && setPage(result))
      .catch((err) => !ignore && setError(toApiError(err).message));
    return () => {
      ignore = true;
    };
  }, [userId]);

  const loadMore = async () => {
    if (!page) return;
    setIsLoadingMore(true);
    try {
      const next = await getUserOrders(userId, page.orders.length, ORDERS_PAGE_SIZE);
      setPage((prev) => prev && { ...prev, orders: [...prev.orders, ...next.orders], total: next.total });
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const replaceOrder = (updated: OrderWithItems) =>
    setPage((prev) => prev && { ...prev, orders: prev.orders.map((o) => (o._id === updated._id ? updated : o)) });

  if (error && !page) return <ErrorBox message={error} />;

  if (!page) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-60 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  const { user } = page;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-white px-5 py-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
          {initials(user.first_name, user.last_name)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-lg font-semibold">{user.first_name} {user.last_name}</span>
          <span className="truncate text-[13px] text-muted">
            {user.email_id}
            {user.email_verified ? "" : " (not verified)"}
            {user.phone_no ? ` · ${user.phone_no.replace("_", " ")}` : ""}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5 text-[13px] text-muted">
          <span>Joined {formatDate(user.createdAt)}</span>
          <span>{page.total} {page.total === 1 ? "order" : "orders"}</span>
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      {page.orders.length === 0 && (
        <p className="rounded-xl bg-surface px-4 py-16 text-center text-sm text-muted">This user hasn't placed any orders yet.</p>
      )}

      {page.orders.map((order) => <AdminOrderCard key={order._id} order={order} onUpdated={replaceOrder} />)}

      {page.orders.length > 0 && page.orders.length < page.total && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted">Showing {page.orders.length} of {page.total} orders</p>
          <button type="button" onClick={loadMore} disabled={isLoadingMore} className={loadMoreClass}>
            {isLoadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------- page ---------------------------------- */

export default function AdminDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <div className="min-h-svh bg-surface font-sans text-ink antialiased">
      <Header />

      <section className="mx-auto max-w-300 px-4 pt-8 xl:px-0">
        <div className="flex flex-col gap-1.5 leading-[1.2]">
          <h1 className="text-[28px] font-bold tracking-[-0.56px]">Admin dashboard</h1>
          <p className="text-sm text-muted">See your users and manage their orders.</p>
        </div>
      </section>

      <main className="mx-auto grid max-w-300 items-start gap-6 px-4 pt-7 pb-20 lg:grid-cols-[360px_1fr] xl:px-0">
        <UsersPanel selectedId={selectedUserId} onSelect={setSelectedUserId} />

        {selectedUserId ? (
          // key: a new user starts with a fresh panel (no orders from the previous one flashing)
          <UserOrdersPanel key={selectedUserId} userId={selectedUserId} />
        ) : (
          <div className="grid min-h-80 place-items-center rounded-xl border border-dashed border-line bg-white px-4 text-center">
            <p className="text-sm text-muted">Select a user to see their orders.</p>
          </div>
        )}
      </main>
    </div>
  );
}
