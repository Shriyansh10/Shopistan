export const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function sellingPrice(price: number, discount: number) {
  return price * (1 - discount / 100);
}

// non-Amazon URLs are returned unchanged
export function largeImage(url: string) {
  return url.replace("._AC_UL320_.", "._AC_SL1000_.");
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

export function timeAgo(iso: string) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000; // negative = in the past
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

// "No reviews yet" / "1 review" / "1,234 reviews"
export function reviewCount(total: number) {
  if (total === 0) return "No reviews yet";
  return total === 1 ? "1 review" : `${total.toLocaleString()} reviews`;
}

export function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

// short, readable order number from the Mongo id: "6ad0f1c2…e0f123" → "#D9E0F123"
export function orderNumber(orderId: string) {
  return `#${orderId.slice(-8).toUpperCase()}`;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

// "25 Sep 2026"
export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

const PAYMENT_LABELS: Record<string, string> = { cod: "Cash on delivery", card: "Card", upi: "UPI" };

export function paymentMethodLabel(method: string) {
  return PAYMENT_LABELS[method] ?? method;
}
