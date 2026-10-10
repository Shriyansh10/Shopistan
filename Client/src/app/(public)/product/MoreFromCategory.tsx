/*
 * Journal — src/app/(public)/product/MoreFromCategory.tsx
 *
 * 2026-10-09 (Claude): Created. "More from <category>" carousel on the product page. Uses the existing
 *   GET /dashboard/categories/:id/products: fetches 11, drops the product being viewed, shows up to 10
 *   (fewer only if the category is that small). Horizontal scroll with snap: 2 cards visible on phones,
 *   3 on tablets, 4 on desktop. Prev/next buttons scroll one screenful and are disabled at either end;
 *   swipe/trackpad scrolling works too. Hidden entirely if there's nothing to show.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard, SkeletonCard } from "../../../components/ProductCard";
import { getProducts, type Product } from "../../../services/dashboard.service";

const SHOW = 10;

type MoreFromCategoryProps = {
  categoryId: string;
  categoryName: string;
  currentProductId: string;
};

const slideClass =
  "w-[calc(50%-8px)] shrink-0 snap-start md:w-[calc((100%-48px)/3)] lg:w-[calc((100%-72px)/4)]";

function ArrowButton({ direction, disabled, onClick }: { direction: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous products" : "Next products"}
      className="grid size-11 place-items-center rounded-full border border-line bg-white transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={direction === "prev" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
      </svg>
    </button>
  );
}

export default function MoreFromCategory({ categoryId, categoryName, currentProductId }: MoreFromCategoryProps) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;
    getProducts(categoryId, 0, SHOW + 1)
      .then(({ products }) => {
        if (!ignore) setProducts(products.filter((p) => p._id !== currentProductId).slice(0, SHOW));
      })
      .catch(() => !ignore && setProducts([])); // optional section: on error just hide it
    return () => {
      ignore = true;
    };
  }, [categoryId, currentProductId]);

  // enable/disable the arrows based on scroll position
  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({
      atStart: el.scrollLeft <= 1,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
    });
  }, []);

  // measure after the cards render, and again when the window is resized
  useEffect(() => {
    const frame = requestAnimationFrame(updateEdges);
    window.addEventListener("resize", updateEdges);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateEdges);
    };
  }, [products, updateEdges]);

  const scroll = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  };

  if (products && products.length === 0) return null;

  return (
    <section className="border-t border-line py-18">
      <div className="mx-auto max-w-300 px-4 xl:px-0">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-[28px] leading-tight font-bold tracking-[-0.6px]">More from {categoryName}</h2>
          <div className="flex shrink-0 gap-2">
            <ArrowButton direction="prev" disabled={edges.atStart} onClick={() => scroll(-1)} />
            <ArrowButton direction="next" disabled={edges.atEnd} onClick={() => scroll(1)} />
          </div>
        </div>

        <div
          ref={trackRef}
          onScroll={updateEdges}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] md:gap-6 [&::-webkit-scrollbar]:hidden"
        >
          {products
            ? products.map((p) => (
                <div key={p._id} className={slideClass}>
                  <ProductCard product={p} categoryName={categoryName} />
                </div>
              ))
            : Array.from({ length: 4 }, (_, i) => (
                <div key={i} className={slideClass}>
                  <SkeletonCard />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
