/*
 * Journal — src/app/(public)/product/ProductDetail.tsx
 *
 * 2026-10-09 (Claude): Created from design/product-detail.html. Public product page at /product/:productId.
 *   Loads GET /dashboard/product/:id (product + category + department) and shows: breadcrumb, large image
 *   (1000px variant of the seeded 320px image, falls back to the original if it fails), buy box (category,
 *   title, rating + review count, price with discount, quantity, Add to cart, wishlist, delivery notes),
 *   "About this item" (description, or an empty state — seeded products have none), then ProductReviews
 *   and the MoreFromCategory carousel.
 *   The page body is keyed by productId, so opening another product (e.g. from the carousel) starts fresh
 *   and scrolls to the top.
 *   Cart and wishlist have no API yet: guests are sent to sign in (and come back here); logged-in users see a
 *   "coming soon" note. Breadcrumb department/category are plain text — the home page can't open a given
 *   department from a URL yet. Department tabs from the design are left out for the same reason.
 *   Delivery/returns/payment notes are placeholder copy.
 *
 * 2026-10-09 (Claude): Wishlist is now real (GET/POST /wishlist/item/:productId) via WishlistButton: the heart
 *   icon became a full-width "Add to wishlist" button under Add to cart. Guests → sign in and come back.
 *   Logged in → the page checks whether the product is already saved (on load, on reload, and right after
 *   login); if so it shows a disabled "Added to wishlist" with a link to /wishlist (removing happens there).
 *   Cart is still "coming soon".
 *
 * 2026-10-10 (Claude): Add to cart is now real (POST /cart/item/:id with the chosen quantity). Guests still go to
 *   sign in first. Shows "Added to cart — you have N in your cart" (or a note when the 10-per-product cap is
 *   reached) with a "View cart" link; errors show in red. Button reads "Adding..." while saving. After adding,
 *   the header cart badge is refreshed (useCartCount().refreshCount).
 */

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Stars from "../../../components/Stars";
import { useAuth } from "../../../context/auth.context";
import { toApiError, type ApiError } from "../../../lib/api_error";
import { largeImage, reviewCount, sellingPrice, usd } from "../../../lib/format";
import { getProductDetails, type ProductDetails } from "../../../services/product.service";
import { addToWishlist, isInWishlist } from "../../../services/wishlist.service";
import { addToCart } from "../../../services/cart.service";
import { useCartCount } from "../../../context/cart.context";
import ProductReviews from "./ProductReviews";
import MoreFromCategory from "./MoreFromCategory";

const MAX_QTY = 10;

const perks = [
  { title: "Delivery in 3–5 days", text: "Free delivery on orders over $35", icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7" },
  { title: "7-day easy returns", text: "Return it unused, get a full refund", icon: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" },
  { title: "Secure payment", text: "UPI, cards and cash on delivery", icon: "M4 11h16v10H4zM8 11V7a4 4 0 0 1 8 0v4" },
];

// ---------- Wishlist button ----------

// Guest: "Add to wishlist" → sign in (and come back here).
// Logged in: checks once whether this product is already saved — on page load, on reload, and right after
// logging in (status turns "authenticated"). Saved → disabled "Added to wishlist" + link to /wishlist,
// where items are removed. Not saved → click adds it, then it switches to "Added".
function WishlistButton({ productId }: { productId: string }) {
  const { status, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // remembers which user the answer is for, so a different login never sees someone else's state
  const [saved, setSaved] = useState<{ userId: string; inWishlist: boolean } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    let ignore = false;
    isInWishlist(productId)
      .then((inWishlist) => !ignore && setSaved({ userId: user.id, inWishlist }))
      // if the check fails, let them press Add — adding twice is harmless on the server
      .catch(() => !ignore && setSaved({ userId: user.id, inWishlist: false }));
    return () => {
      ignore = true;
    };
  }, [status, user, productId]);

  // null = not known yet (still checking)
  const inWishlist = user && saved?.userId === user.id ? saved.inWishlist : null;

  const add = async () => {
    if (status !== "authenticated" || !user) {
      navigate(`/auth/login?next=${encodeURIComponent(pathname)}`, {
        state: { message: "Please sign in to add this item to your wishlist." },
      });
      return;
    }
    setIsAdding(true);
    setError(null);
    try {
      await addToWishlist(productId);
      setSaved({ userId: user.id, inWishlist: true });
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsAdding(false);
    }
  };

  const heart = (filled: boolean) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" /></svg>
  );
  const buttonClass =
    "flex h-12 w-full items-center justify-center gap-2.5 rounded-[10px] border text-[15px] font-semibold transition";

  if (status === "authenticated" && inWishlist) {
    return (
      <div className="flex flex-col gap-2">
        <button type="button" disabled className={`${buttonClass} cursor-default border-success/30 bg-success/10 text-success`}>
          {heart(true)}
          Added to wishlist
        </button>
        <Link to="/wishlist" className="self-center text-sm font-semibold text-brand hover:underline">
          View your wishlist →
        </Link>
      </div>
    );
  }

  // checking = session check in flight, or logged in but the wishlist answer hasn't arrived yet
  const checking = status === "checking" || (status === "authenticated" && inWishlist === null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={add}
        disabled={checking || isAdding}
        className={`${buttonClass} border-ink bg-white hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white disabled:hover:text-ink`}
      >
        {heart(false)}
        {isAdding ? "Adding..." : "Add to wishlist"}
      </button>
      {error && (
        <p role="alert" className="rounded-[10px] bg-danger/10 px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------- Buy box ----------

function BuyBox({ details, reviewTotal }: { details: ProductDetails; reviewTotal: number | null }) {
  const { product, category_details } = details;
  const { status } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { refreshCount } = useCartCount();
  const [qty, setQty] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [cartNote, setCartNote] = useState<{ ok: boolean; text: string } | null>(null);

  const selling = sellingPrice(product.price, product.discount);

  // guests sign in first (and come back here); logged-in users add `qty` on top of what's already in the cart
  const handleAddToCart = async () => {
    if (status !== "authenticated") {
      navigate(`/auth/login?next=${encodeURIComponent(pathname)}`, {
        state: { message: "Please sign in to add items to your cart." },
      });
      return;
    }
    setIsAdding(true);
    setCartNote(null);
    try {
      const item = await addToCart(product._id, qty);
      void refreshCount(); // update the header badge
      // the server caps each product at MAX_QTY, so the cart may hold less than before + qty
      setCartNote({
        ok: true,
        text:
          item.quantity >= MAX_QTY
            ? `Your cart now has ${MAX_QTY} of this item (the most you can add).`
            : `Added to cart — you have ${item.quantity} in your cart.`,
      });
    } catch (err) {
      setCartNote({ ok: false, text: toApiError(err).message });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-[13px] font-semibold tracking-[3px] text-brand uppercase">{category_details.name}</span>
        <h1 className="mt-3 text-[26px] leading-[1.2] font-bold tracking-[-0.8px] md:text-[32px]">{product.name}</h1>
      </div>

      {product.rating > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted">
          <Stars rating={product.rating} className="text-base" />
          <strong className="font-semibold text-ink">{product.rating.toFixed(1)}</strong>
          {reviewTotal !== null && (
            <>
              ·
              <a href="#reviews" className="text-ink underline underline-offset-3">
                {reviewCount(reviewTotal)}
              </a>
            </>
          )}
        </div>
      )}

      <div className="border-y border-line py-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[40px] leading-none font-bold tracking-[-1px]">{usd.format(selling)}</span>
          {product.discount > 0 && (
            <>
              <span className="text-lg text-subtle line-through">{usd.format(product.price)}</span>
              <span className="text-base font-semibold text-success">
                You save {usd.format(product.price - selling)} ({product.discount}%)
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm font-medium">
        Quantity
        <div className="inline-flex h-12 items-center rounded-[10px] border border-line">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            className="h-full w-11 text-lg text-muted disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-9 text-center font-semibold" aria-live="polite">{qty}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
            disabled={qty >= MAX_QTY}
            className="h-full w-11 text-lg text-muted disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAdding || status === "checking"}
          className="flex h-13.5 w-full items-center justify-center gap-2.5 rounded-[10px] bg-brand text-base font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="13" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          {isAdding ? "Adding..." : "Add to cart"}
        </button>
        {cartNote && (
          <p
            role={cartNote.ok ? "status" : "alert"}
            className={`rounded-[10px] px-4 py-2.5 text-sm ${cartNote.ok ? "bg-success/10" : "bg-danger/10 text-danger"}`}
          >
            {cartNote.text}{" "}
            {cartNote.ok && (
              <Link to="/cart" className="font-semibold text-brand hover:underline">
                View cart →
              </Link>
            )}
          </p>
        )}
        <WishlistButton productId={product._id} />
      </div>

      <div className="grid gap-3.5 rounded-[14px] bg-surface p-5">
        {perks.map((perk) => (
          <div key={perk.title} className="flex items-start gap-3 text-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-px shrink-0 text-brand"><path d={perk.icon} /></svg>
            <div>
              {perk.title}
              <p className="mt-0.5 text-[13px] text-muted">{perk.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Page body (one product) ----------

function ProductDetail({ productId }: { productId: string }) {
  const [details, setDetails] = useState<ProductDetails | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [reviewTotal, setReviewTotal] = useState<number | null>(null);
  const [imageSrc, setImageSrc] = useState<"large" | "original">("large");

  useEffect(() => {
    window.scrollTo(0, 0);
    let ignore = false;
    getProductDetails(productId)
      .then((d) => !ignore && setDetails(d))
      .catch((err) => !ignore && setError(toApiError(err)));
    return () => {
      ignore = true;
    };
  }, [productId]);

  if (error) {
    const notFound = error.statusCode === 404 || error.statusCode === 400;
    return (
      <main className="mx-auto flex max-w-300 flex-col items-center px-4 py-24 text-center">
        <h1 className="text-3xl font-bold tracking-[-1px]">{notFound ? "Product not found" : "Something went wrong"}</h1>
        <p className="mt-3 text-muted">{notFound ? "This product doesn't exist or was removed." : error.message}</p>
        <Link to="/" className="mt-8 rounded-[10px] bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-hover">
          Continue shopping
        </Link>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="mx-auto grid max-w-300 animate-pulse gap-14 px-4 py-18 md:grid-cols-[1.05fr_1fr] xl:px-0">
        <div className="aspect-square rounded-[20px] bg-gray-100" />
        <div className="flex flex-col gap-4">
          <div className="h-4 w-1/3 rounded bg-gray-100" />
          <div className="h-8 w-full rounded bg-gray-100" />
          <div className="h-8 w-2/3 rounded bg-gray-100" />
          <div className="mt-6 h-12 w-1/3 rounded bg-gray-100" />
        </div>
      </main>
    );
  }

  const { product, category_details, department_details } = details;

  return (
    <>
      <main className="mx-auto max-w-300 px-4 xl:px-0">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 py-6 text-sm text-muted">
          <Link to="/" className="hover:text-ink">Home</Link>
          {department_details && (
            <>
              <span className="text-gray-300">/</span>
              <span>{department_details.name}</span>
            </>
          )}
          <span className="text-gray-300">/</span>
          <span>{category_details.name}</span>
          <span className="text-gray-300">/</span>
          <span className="max-w-90 truncate text-ink">{product.name}</span>
        </nav>

        {/* Image + buy box */}
        <section className="grid gap-8 pb-18 md:grid-cols-[1.05fr_1fr] md:gap-14">
          <div className="relative grid aspect-square place-items-center overflow-hidden rounded-[20px] bg-gray-100 p-8 md:p-12">
            {product.discount > 0 && (
              <span className="absolute top-5 left-5 rounded-full bg-success px-3 py-1.5 text-[13px] font-bold text-white">
                {product.discount}% off
              </span>
            )}
            <img
              src={imageSrc === "large" ? largeImage(product.image) : product.image}
              onError={() => setImageSrc("original")}
              alt={product.name}
              className="max-h-full max-w-full object-contain mix-blend-multiply"
            />
          </div>
          <BuyBox details={details} reviewTotal={reviewTotal} />
        </section>
      </main>

      {/* About this item */}
      <section className="border-t border-line py-18">
        <div className="mx-auto max-w-300 px-4 xl:px-0">
          <h2 className="text-[28px] font-bold tracking-[-0.6px]">About this item</h2>
          {product.description ? (
            <p className="mt-5 max-w-180 text-[15px] leading-[1.7] whitespace-pre-line text-gray-700">{product.description}</p>
          ) : (
            <p className="mt-5 max-w-180 rounded-[14px] border border-dashed border-line p-5 text-[15px] text-muted">
              The seller hasn't added a description for this product yet.
            </p>
          )}
          <dl className="mt-6 grid max-w-180 grid-cols-[140px_1fr] text-sm sm:grid-cols-[180px_1fr]">
            {department_details && (
              <>
                <dt className="border-b border-line py-3 text-muted">Department</dt>
                <dd className="border-b border-line py-3">{department_details.name}</dd>
              </>
            )}
            <dt className="border-b border-line py-3 text-muted">Category</dt>
            <dd className="border-b border-line py-3">{category_details.name}</dd>
            {product.rating > 0 && (
              <>
                <dt className="border-b border-line py-3 text-muted">Rating</dt>
                <dd className="border-b border-line py-3">{product.rating.toFixed(1)} out of 5</dd>
              </>
            )}
          </dl>
        </div>
      </section>

      <ProductReviews productId={product._id} rating={product.rating} onTotal={setReviewTotal} />

      <MoreFromCategory
        categoryId={category_details._id}
        categoryName={category_details.name}
        currentProductId={product._id}
      />
    </>
  );
}

// ---------- Route component ----------

export default function ProductPage() {
  const { productId = "" } = useParams();

  return (
    <div className="min-h-svh bg-white font-sans text-ink antialiased">
      <Header />
      {/* key → a different product remounts the body, so no state carries over between products */}
      <ProductDetail key={productId} productId={productId} />
      <Footer />
    </div>
  );
}
