/*
 * Journal — src/app/(protected)/Cart.tsx
 *
 * 2026-10-10 (Claude): Created from Figma "04 — Cart" (file JGm3nXiqAV3cZjSFqpEuX8, node 15:254). The real /cart
 *   page (protected by RequireAuth), replacing the placeholder.
 *   - Title "Shopping cart" + "N items in your cart" (different products) + "← Continue shopping".
 *   - Item cards: image and name (link to /product/:id), selling price + original struck through + "% off",
 *     delivery note, quantity stepper 1–10 (PUT /cart/item/:id), "Save for later" (adds to the wishlist, then
 *     removes from the cart) and "Remove" (DELETE /cart/item/:id). After every change the cart is reloaded so
 *     the totals always come from the server.
 *   - Order summary: Subtotal (sum of quantities) at original prices, Discount, Delivery FREE, Total payable
 *     (= server's totalEstimatedPrice), "You save …", Proceed to checkout.
 *   - Empty state with "Continue shopping".
 *   Uses the shared Header/Footer instead of the frame's own header. Left out of the design: variant line
 *   ("Charcoal · Size L"), "Sold by …", Taxes & charges, and the coupon box — no data/API for them.
 *   "Proceed to checkout" shows a "coming soon" note (order routes aren't mounted yet). Delivery text is the
 *   same placeholder copy as the product page. Prices in USD like the rest of the store (the frame shows ₹).
 *
 * 2026-10-10 (Claude): After every quantity change / save for later / remove, the header cart badge is refreshed.
 */

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { toApiError } from "../../lib/api_error";
import { sellingPrice, usd } from "../../lib/format";
import { getCart, removeFromCart, updateCartQuantity, type Cart as CartData, type CartItem } from "../../services/cart.service";
import { addToWishlist } from "../../services/wishlist.service";
import { useCartCount } from "../../context/cart.context";

const MAX_QTY = 10;

// ---------- One cart line ----------

type CartRowProps = {
  item: CartItem;
  busy: boolean;
  onQuantity: (quantity: number) => void;
  onSaveForLater: () => void;
  onRemove: () => void;
};

function CartRow({ item, busy, onQuantity, onSaveForLater, onRemove }: CartRowProps) {
  const selling = sellingPrice(item.price, item.discount);
  const stepButton = "grid h-9.5 w-9 place-items-center text-[15px] leading-none disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <article className={`flex gap-4 rounded-xl border border-line bg-white p-4 transition ${busy ? "opacity-60" : ""}`}>
      <Link
        to={`/product/${item._id}`}
        className="grid h-29 w-26 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-gray-100 p-2"
      >
        {/* multiply blends the product photo's white background into the grey tile */}
        <img src={item.image} alt="" loading="lazy" className="max-h-full max-w-full object-contain mix-blend-multiply" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-1.75">
          <Link
            to={`/product/${item._id}`}
            title={item.name}
            className="line-clamp-2 text-base leading-[1.35] font-semibold hover:underline"
          >
            {item.name}
          </Link>
          <div className="flex flex-wrap items-baseline gap-x-2 leading-[1.2]">
            <span className="text-[17px] font-bold">{usd.format(selling)}</span>
            {item.discount > 0 && (
              <>
                <span className="text-[13px] text-subtle line-through">{usd.format(item.price)}</span>
                <span className="text-xs font-semibold text-success">{item.discount}% off</span>
              </>
            )}
          </div>
          <p className="text-xs leading-[1.3] font-medium text-success">Delivery in 3–5 days</p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3.5 sm:flex-col sm:items-end sm:justify-start">
          <div className="flex items-center rounded-[9px] border border-line bg-white">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => onQuantity(item.quantity - 1)}
              disabled={busy || item.quantity <= 1}
              className={stepButton}
            >
              −
            </button>
            <span className="grid h-9.5 w-11.5 place-items-center text-[15px] leading-none font-semibold" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => onQuantity(item.quantity + 1)}
              disabled={busy || item.quantity >= MAX_QTY}
              className={stepButton}
            >
              +
            </button>
          </div>
          <div className="flex items-center gap-3.5 text-[13px] leading-[1.2] font-semibold">
            <button type="button" onClick={onSaveForLater} disabled={busy} className="text-muted hover:text-ink disabled:cursor-not-allowed">
              Save for later
            </button>
            <button type="button" onClick={onRemove} disabled={busy} className="text-brand hover:text-brand-hover disabled:cursor-not-allowed">
              Remove
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ---------- Order summary ----------

function SummaryRow({ label, value, valueClass = "text-ink" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between text-sm leading-[1.3]">
      <span className="text-muted">{label}</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

function OrderSummary({ cart, onCheckout }: { cart: CartData; onCheckout: () => void }) {
  const units = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0); // at original prices
  const total = cart.totalEstimatedPrice;
  const discount = Math.max(0, Math.round((subtotal - total) * 100) / 100);

  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-line bg-white p-5">
      <h2 className="text-[17px] leading-[1.2] font-bold">Order summary</h2>
      <div className="h-px bg-line" />
      <SummaryRow label={`Subtotal (${units} ${units === 1 ? "item" : "items"})`} value={usd.format(subtotal)} />
      {discount > 0 && <SummaryRow label="Discount" value={`− ${usd.format(discount)}`} valueClass="text-success" />}
      <SummaryRow label="Delivery" value="FREE" valueClass="text-success" />
      <div className="h-px bg-line" />
      <div className="flex items-center justify-between text-base leading-[1.3] font-bold">
        <span>Total payable</span>
        <span>{usd.format(total)}</span>
      </div>
      {discount > 0 && (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-xs leading-[1.2] font-semibold text-success">
          You save {usd.format(discount)} on this order
        </p>
      )}
      <button
        type="button"
        onClick={onCheckout}
        className="w-full rounded-[10px] bg-brand px-5.5 py-3.5 text-[15px] leading-[1.2] font-semibold text-white transition hover:bg-brand-hover"
      >
        Proceed to checkout
      </button>
    </div>
  );
}

// ---------- Page ----------

export default function Cart() {
  const { refreshCount } = useCartCount();
  const [cart, setCart] = useState<CartData | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setCart(await getCart());
    } catch (err) {
      setError(toApiError(err).message);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    getCart()
      .then((c) => !ignore && setCart(c))
      .catch((err) => !ignore && setError(toApiError(err).message));
    return () => {
      ignore = true;
    };
  }, []);

  // runs one change for an item (disabling its row meanwhile), then reloads the cart so totals come from the server
  const change = async (productId: string, action: () => Promise<unknown>) => {
    setBusy((prev) => new Set(prev).add(productId));
    setError(null);
    setNote(null);
    try {
      await action();
    } catch (err) {
      const apiError = toApiError(err);
      // 404 = the item is no longer in the cart (e.g. removed in another tab); the reload below shows that
      if (apiError.statusCode !== 404) setError(apiError.message);
    } finally {
      await reload();
      void refreshCount(); // update the header badge
      setBusy((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const saveForLater = (productId: string) =>
    change(productId, async () => {
      await addToWishlist(productId); // adding twice is harmless
      await removeFromCart(productId);
      setNote("Saved to your wishlist.");
    });

  const count = cart?.items.length ?? 0;

  return (
    <div className="min-h-svh bg-white font-sans text-ink antialiased">
      <Header />

      {/* Title */}
      <section className="mx-auto max-w-300 px-4 pt-8 xl:px-0">
        <div className="flex items-center justify-between gap-4 leading-[1.2]">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[28px] font-bold tracking-[-0.56px]">Shopping cart</h1>
            <p className="text-sm text-muted">
              {cart ? `${count} ${count === 1 ? "item" : "items"} in your cart` : " "}
            </p>
          </div>
          <Link to="/" className="shrink-0 text-sm font-semibold text-brand hover:text-brand-hover">
            ←&nbsp; Continue shopping
          </Link>
        </div>

        {note && (
          <p role="status" className="mt-5 rounded-[10px] bg-brand/10 px-4 py-2.5 text-sm">
            {note}{" "}
            {note.startsWith("Saved") && (
              <Link to="/wishlist" className="font-semibold text-brand hover:underline">
                View wishlist
              </Link>
            )}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-5 rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
      </section>

      {/* Body */}
      <main className="mx-auto max-w-300 px-4 pt-7 pb-20 xl:px-0">
        {!cart && !error && (
          <div className="flex animate-pulse flex-col gap-8 lg:flex-row">
            <div className="flex flex-1 flex-col gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-37.5 rounded-xl bg-gray-100" />
              ))}
            </div>
            <div className="h-80 rounded-xl bg-gray-100 lg:w-95" />
          </div>
        )}

        {cart && cart.items.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl bg-surface px-4 py-20 text-center">
            <h2 className="text-xl font-semibold">Your cart is empty</h2>
            <p className="mt-2 text-[15px] text-muted">Products you add to your cart will show up here.</p>
            <Link
              to="/"
              className="mt-6 rounded-[10px] bg-brand px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-hover"
            >
              Continue shopping
            </Link>
          </div>
        )}

        {cart && cart.items.length > 0 && (
          <div className="flex flex-col items-start gap-8 lg:flex-row">
            <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
              {cart.items.map((item) => (
                <CartRow
                  key={item._id}
                  item={item}
                  busy={busy.has(item._id)}
                  onQuantity={(q) => change(item._id, () => updateCartQuantity(item._id, q))}
                  onSaveForLater={() => saveForLater(item._id)}
                  onRemove={() => change(item._id, () => removeFromCart(item._id))}
                />
              ))}
            </div>
            <div className="flex w-full shrink-0 flex-col gap-4.5 lg:w-95">
              <OrderSummary cart={cart} onCheckout={() => setNote("Checkout is coming soon.")} />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
