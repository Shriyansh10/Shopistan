import type { OrderStatus } from "../services/order.service";

const STYLES: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Confirmed", className: "bg-success/10 text-success" },
  shipped: { label: "In transit", className: "bg-blue-50 text-blue-700" },
  delivered: { label: "Delivered", className: "bg-success/10 text-success" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-muted" },
};

export default function OrderStatusPill({ status }: { status: OrderStatus }) {
  const { label, className } = STYLES[status] ?? STYLES.pending;
  return (
    <span className={`inline-flex rounded-full px-3 py-1.5 text-xs leading-[1.2] font-semibold tracking-[0.4px] uppercase ${className}`}>
      {label}
    </span>
  );
}
