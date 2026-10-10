/*
 * Journal — src/app/(protected)/Wishlist.tsx
 *
 * 2026-10-09 (Claude): Created from Figma "09 — Wishlist" (file JGm3nXiqAV3cZjSFqpEuX8, node 17:204). The real
 *   /wishlist page (protected by RequireAuth), replacing the placeholder.
 *   - Title "My wishlist" + "N items saved", 4-column grid (2 on phones, 3 on tablets) of saved products, newest
 *     first, 12 at a time with "Load more" (GET /wishlist?offset=&limit=).
 *   - Each card: product image and name (both link to /product/:id), price with the original struck through,
 *     filled-heart button that removes it (DELETE /wishlist/item/:id; a 404 means it was already gone, so it's
 *     removed from the list too), and "Move to cart".
 *   - Empty state with "Continue shopping".
 *   Uses the shared Header/Footer instead of the frame's own header (its nav links Men/Women/… have no pages).
 *   Not built from the design: stock status lines ("In stock", "Only 2 left", "Out of stock" / "Notify me") —
 *   products have no stock data. "Move to cart" / "Move all to cart" show a "coming soon" note: no cart API yet.
 *   Prices in USD like the rest of the store (the frame shows ₹).
 *
 * 2026-10-10 (Claude): "Move to cart" and "Move all to cart" now work: each adds 1 to the cart
 *   (POST /cart/item/:id), then removes it from the wishlist (a 404 there counts as done). Move all goes through
 *   the items currently shown one by one, stops at the first error, then reloads the list so anything left over
 *   shows up again. Success shows "Moved … to your cart. View cart →"; the header cart badge is refreshed.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import heartFilled from "../../assets/icons/heart-filled.svg";
import { toApiError } from "../../lib/api_error";
import { sellingPrice, usd } from "../../lib/format";
import type { Product } from "../../services/dashboard.service";
import { getWishlist, removeFromWishlist } from "../../services/wishlist.service";
import { addToCart } from "../../services/cart.service";
import { useCartCount } from "../../context/cart.context";

const PAGE_SIZE = 12;

// ---------- One saved product ----------

type WishlistCardProps = {
  product: Product;
  busy: boolean; // removing or moving to cart
  onRemove: () => void;
  onMoveToCart: () => void;
};

function WishlistCard({ product, busy, onRemove, onMoveToCart }: WishlistCardProps) {
  const selling = sellingPrice(product.price, product.discount);

  return (
    <article className={`flex flex-col gap-3 transition ${busy ? "opacity-50" : ""}`}>
      <div className="relative">
        <Link
          to={`/product/${product._id}`}
          className="grid aspect-[282/268] place-items-center overflow-hidden rounded-xl bg-gray-100 p-6"
        >
          {/* multiply blends the product photo's white background into the grey tile */}
          <img src={product.image} alt="" loading="lazy" className="max-h-full max-w-full object-contain mix-blend-multiply" />
        </Link>
        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          aria-label={`Remove ${product.name} from wishlist`}
          title="Remove from wishlist"
          className="absolute top-3 right-3 grid size-8.5 place-items-center rounded-full border border-line bg-white transition hover:border-brand disabled:cursor-not-allowed"
        >
          <img src={heartFilled} alt="" width={18} height={18} />
        </button>
      </div>

      <Link
        to={`/product/${product._id}`}
        title={product.name}
        className="line-clamp-2 text-sm leading-[1.4] font-medium hover:underline"
      >
        {product.name}
      </Link>

      <div className="flex items-center gap-2 leading-[1.2]">
        <span className="text-base font-bold">{usd.format(selling)}</span>
        {product.discount > 0 && <span className="text-[13px] text-subtle line-through">{usd.format(product.price)}</span>}
      </div>

      <button
        type="button"
        onClick={onMoveToCart}
        disabled={busy}
        className="w-full rounded-[9px] bg-brand px-4 py-2.75 text-sm leading-[1.2] font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:hover:bg-brand"
      >
        Move to cart
      </button>
    </article>
  );
}

function SkeletonWishCard() {
  return (
    <div className="flex animate-pulse flex-col gap-3">
      <div className="aspect-[282/268] rounded-xl bg-gray-100" />
      <div className="h-4 w-4/5 rounded bg-gray-100" />
      <div className="h-4 w-1/3 rounded bg-gray-100" />
      <div className="h-10 rounded-[9px] bg-gray-100" />
    </div>
  );
}

// ---------- Page ----------

export default function Wishlist() {
  const [page, setPage] = useState<{ items: Product[]; total: number } | null>(null);
  const { refreshCount } = useCartCount();
  const [busy, setBusy] = useState<Set<string>>(new Set()); // product ids being removed / moved
  const [isMovingAll, setIsMovingAll] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getWishlist(0, PAGE_SIZE)
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
      // offset = items already shown; removals shift the server's list by the same amount, so nothing is skipped
      const next = await getWishlist(page.items.length, PAGE_SIZE);
      setPage((prev) => prev && { items: [...prev.items, ...next.items], total: next.total });
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const markBusy = (productId: string, on: boolean) =>
    setBusy((prev) => {
      const next = new Set(prev);
      if (on) next.add(productId);
      else next.delete(productId);
      return next;
    });

  // 404 = it was already removed (e.g. in another tab) — the end result is the same, so it isn't an error
  const removeIgnoringMissing = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
    } catch (err) {
      if (toApiError(err).statusCode !== 404) throw err;
    }
  };

  const remove = async (productId: string) => {
    markBusy(productId, true);
    setError(null);
    try {
      await removeIgnoringMissing(productId);
      dropFromList(productId);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      markBusy(productId, false);
    }
  };

  const dropFromList = (productId: string) =>
    setPage((prev) => prev && { items: prev.items.filter((p) => p._id !== productId), total: Math.max(0, prev.total - 1) });

  // add 1 to the cart, then take it off the wishlist
  const moveToCart = async (productId: string) => {
    markBusy(productId, true);
    setError(null);
    setNote(null);
    try {
      await addToCart(productId, 1);
      await removeIgnoringMissing(productId);
      dropFromList(productId);
      setNote("Moved to your cart.");
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      markBusy(productId, false);
      void refreshCount(); // update the header badge
    }
  };

  // moves the items currently shown, one by one (stops at the first error), then reloads the list from the server
  const moveAllToCart = async () => {
    if (!page) return;
    setIsMovingAll(true);
    setError(null);
    setNote(null);
    let moved = 0;
    try {
      for (const p of page.items) {
        await addToCart(p._id, 1);
        await removeIgnoringMissing(p._id);
        moved++;
      }
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      try {
        setPage(await getWishlist(0, PAGE_SIZE)); // anything not moved (or not loaded yet) shows up again
      } catch (err) {
        setError(toApiError(err).message);
      }
      if (moved > 0) setNote(`Moved ${moved} ${moved === 1 ? "item" : "items"} to your cart.`);
      void refreshCount();
      setIsMovingAll(false);
    }
  };

  const total = page?.total ?? 0;

  return (
    <div className="min-h-svh bg-white font-sans text-ink antialiased">
      <Header />

      {/* Title */}
      <section className="mx-auto max-w-300 px-4 pt-8 xl:px-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5 leading-[1.2]">
            <h1 className="text-[28px] font-bold tracking-[-0.56px]">My wishlist</h1>
            <p className="text-sm text-muted">
              {page ? `${total.toLocaleString()} ${total === 1 ? "item" : "items"} saved` : " "}
            </p>
          </div>
          {total > 0 && (
            <button
              type="button"
              onClick={moveAllToCart}
              disabled={isMovingAll || busy.size > 0}
              className="shrink-0 rounded-lg border border-line bg-white px-4 py-2.5 text-[13px] leading-[1.2] font-semibold transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isMovingAll ? "Moving..." : "Move all to cart"}
            </button>
          )}
        </div>

        {note && (
          <p role="status" className="mt-5 rounded-[10px] bg-success/10 px-4 py-2.5 text-sm">
            {note}{" "}
            <Link to="/cart" className="font-semibold text-brand hover:underline">
              View cart →
            </Link>
          </p>
        )}
        {error && (
          <p role="alert" className="mt-5 rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
      </section>

      {/* Grid */}
      <main className="mx-auto max-w-300 px-4 pt-7 pb-20 xl:px-0">
        {page && page.items.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-surface px-4 py-20 text-center">
            <h2 className="text-xl font-semibold">Your wishlist is empty</h2>
            <p className="mt-2 text-[15px] text-muted">Tap "Add to wishlist" on any product to save it here.</p>
            <Link
              to="/"
              className="mt-6 rounded-[10px] bg-brand px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-hover"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {page
              ? page.items.map((p) => (
                  <WishlistCard
                    key={p._id}
                    product={p}
                    busy={isMovingAll || busy.has(p._id)}
                    onRemove={() => remove(p._id)}
                    onMoveToCart={() => moveToCart(p._id)}
                  />
                ))
              : !error && Array.from({ length: 8 }, (_, i) => <SkeletonWishCard key={i} />)}
          </div>
        )}

        {page && page.items.length > 0 && page.items.length < page.total && (
          <div className="mt-12 flex flex-col items-center gap-3.5">
            <p className="text-sm text-muted">
              Showing {page.items.length} of {page.total.toLocaleString()} items
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
