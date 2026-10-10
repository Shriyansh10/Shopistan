/*
 * Journal — src/app/(public)/product/ProductReviews.tsx
 *
 * 2026-10-09 (Claude): Created. "Ratings & reviews" section of the product page (design/product-detail.html).
 *   - Summary: the product's rating (Product.rating from the seed — reviews don't update it yet) + review count.
 *   - Logged in → "Write a review" form: pick 1–5 stars (required) + optional comment (max 1000, as in
 *     addReviewDto). On success the list reloads from the top and a thank-you message shows. Server errors
 *     (e.g. "User has already reviewed this product") show above the button.
 *     Guest → "Sign in to review" box (→ /auth/login?next=<this product>).
 *   - List: newest first, 5 at a time with "Load more". The logged-in user's own review is highlighted with a
 *     "Your review" tag when it's on a loaded page (there's no API to fetch it separately, so it isn't pinned).
 *   - onTotal(total) tells the page the review count for the "N reviews" link in the buy box.
 *   Left out of the design: rating breakdown bars and a sort dropdown (no API for them), photos (skipped).
 */

import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router";
import Stars from "../../../components/Stars";
import { useAuth } from "../../../context/auth.context";
import { toApiError } from "../../../lib/api_error";
import { initials, reviewCount, timeAgo } from "../../../lib/format";
import { addProductReview, getProductReviews, type Review } from "../../../services/product.service";

const PAGE_SIZE = 5;
const COMMENT_MAX = 1000;

// ---------- Write a review ----------

function ReviewForm({ productId, onPosted }: { productId: string; onPosted: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please choose a star rating.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const trimmed = comment.trim();
      await addProductReview(productId, trimmed ? { rating, comment: trimmed } : { rating });
      setRating(0);
      setComment("");
      setPosted(true);
      onPosted();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (posted) {
    return (
      <div className="rounded-2xl border border-line bg-white p-5">
        <h3 className="font-semibold">Thanks for your review!</h3>
        <p className="mt-1 text-[13px] text-muted">It's now showing in the list.</p>
      </div>
    );
  }

  const shown = hover || rating;

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-white p-5">
      <h3 className="font-semibold">Write a review</h3>
      <p className="mt-1 text-[13px] text-muted">Share what you liked or didn't. One review per product.</p>

      <div role="radiogroup" aria-label="Your rating" className="mt-4 flex gap-1.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            className={`text-[28px] leading-none transition ${n <= shown ? "text-amber-500" : "text-gray-200"}`}
          >
            ★
          </button>
        ))}
      </div>

      <label htmlFor="review-comment" className="mt-4 mb-2 block text-[13px] font-medium text-muted">
        Your review <span className="text-subtle">(optional)</span>
      </label>
      <textarea
        id="review-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={COMMENT_MAX}
        placeholder="How was the quality? Did it match the photos?"
        className="min-h-26 w-full resize-y rounded-[10px] border border-line px-3.5 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <p className="mt-1.5 text-right text-xs text-subtle">
        {comment.length} / {COMMENT_MAX}
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-[10px] bg-danger/10 px-3 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 h-11.5 w-full rounded-[10px] bg-ink text-[15px] font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Posting..." : "Post review"}
      </button>
    </form>
  );
}

function GuestReviewBox() {
  const { pathname } = useLocation();
  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-6 text-center">
      <h3 className="font-semibold">Bought this item?</h3>
      <p className="mt-1 text-[13px] text-muted">Sign in to rate it and write a review.</p>
      <Link
        to={`/auth/login?next=${encodeURIComponent(pathname)}`}
        className="mt-3.5 inline-flex h-10.5 items-center rounded-[10px] bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-hover"
      >
        Sign in to review
      </Link>
    </div>
  );
}

// ---------- One review ----------

function ReviewItem({ review, isMine }: { review: Review; isMine: boolean }) {
  const user = review.user_id;
  const name = user ? `${user.first_name} ${user.last_name[0] ?? ""}.` : "Shopistan user";

  return (
    <article className={isMine ? "-mx-5 rounded-[14px] bg-brand/10 px-5 py-6" : "border-b border-line py-6"}>
      <div className="flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">
          {initials(user?.first_name, user?.last_name)}
        </span>
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            {name}
            {isMine && (
              <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">Your review</span>
            )}
          </p>
          <p className="text-[13px] text-subtle">{timeAgo(review.createdAt)}</p>
        </div>
      </div>
      <Stars rating={review.rating} className="mt-3 text-sm" />
      {review.comment && <p className="mt-2 max-w-170 text-[15px] leading-[1.6] text-gray-700">{review.comment}</p>}
    </article>
  );
}

// ---------- Section ----------

type ProductReviewsProps = {
  productId: string;
  rating: number;
  onTotal: (total: number) => void;
};

export default function ProductReviews({ productId, rating, onTotal }: ProductReviewsProps) {
  const { status, user } = useAuth();
  const [page, setPage] = useState<{ reviews: Review[]; total: number } | null>(null);
  const [version, setVersion] = useState(0); // bumped after posting a review → reload from the top
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getProductReviews(productId, 0, PAGE_SIZE)
      .then((result) => {
        if (ignore) return;
        setPage(result);
        onTotal(result.total);
      })
      .catch((err) => !ignore && setError(toApiError(err).message));
    return () => {
      ignore = true;
    };
  }, [productId, version, onTotal]);

  const loadMore = async () => {
    if (!page) return;
    setIsLoadingMore(true);
    try {
      const next = await getProductReviews(productId, page.reviews.length, PAGE_SIZE);
      setPage({ reviews: [...page.reviews, ...next.reviews], total: next.total });
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const total = page?.total ?? 0;

  return (
    <section id="reviews" className="scroll-mt-24 border-t border-line bg-surface py-18">
      <div className="mx-auto max-w-300 px-4 xl:px-0">
        <h2 className="mb-8 text-[28px] font-bold tracking-[-0.6px]">Ratings &amp; reviews</h2>

        <div className="grid gap-14 lg:grid-cols-[340px_1fr]">
          {/* Left: summary + write a review */}
          <aside className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="text-[56px] leading-none font-bold tracking-[-2px]">{rating.toFixed(1)}</span>
              <div>
                <Stars rating={rating} className="text-base" />
                <p className="mt-1 text-sm text-muted">
                  {page ? reviewCount(total) : " "}
                </p>
              </div>
            </div>

            {status === "authenticated" && <ReviewForm productId={productId} onPosted={() => setVersion((v) => v + 1)} />}
            {status === "guest" && <GuestReviewBox />}
          </aside>

          {/* Right: list */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{page && total > 0 ? reviewCount(total) : "Reviews"}</h3>
              {total > 1 && <span className="text-[13px] text-muted">Newest first</span>}
            </div>

            {error && (
              <p role="alert" className="mt-4 rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}

            {!page && !error && <p className="py-6 text-sm text-muted">Loading reviews...</p>}

            {page && page.total === 0 && (
              <p className="py-6 text-[15px] text-muted">No reviews yet. Be the first to review this product.</p>
            )}

            {page?.reviews.map((r) => (
              <ReviewItem key={r._id} review={r} isMine={!!user && r.user_id?._id === user.id} />
            ))}

            {page && page.reviews.length < page.total && (
              <div className="mt-8 flex flex-col items-center gap-3.5">
                <p className="text-sm text-muted">
                  Showing {page.reviews.length} of {page.total.toLocaleString()} reviews
                </p>
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="h-11.5 rounded-[10px] border border-ink bg-white px-6 text-sm font-semibold transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoadingMore ? "Loading..." : "Load more reviews"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
