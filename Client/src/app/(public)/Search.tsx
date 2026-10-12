import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductFiltersBar from "../../components/ProductFiltersBar";
import { ProductCard, SkeletonCard } from "../../components/ProductCard";
import { toApiError } from "../../lib/api_error";
import { FILTER_KEYS, filtersFromParams, filtersKey, hasFilters, type ProductFilters } from "../../lib/product_filters";
import { searchProducts, type SearchProduct } from "../../services/dashboard.service";

const PAGE_SIZE = 10;

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const filters = useMemo(() => filtersFromParams(params), [params]);
  const searchKey = `${q}|${filtersKey(filters)}`;

  const [result, setResult] = useState<{ key: string; products: SearchProduct[]; total: number } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // first page whenever the search or the filters change
  useEffect(() => {
    if (!q) return;
    const key = `${q}|${filtersKey(filters)}`;
    let ignore = false;
    searchProducts(q, filters, 0, PAGE_SIZE)
      .then(({ products, total }) => !ignore && setResult({ key, products, total }))
      .catch((err) => !ignore && setError({ key, message: toApiError(err).message }));
    return () => {
      ignore = true;
    };
  }, [q, filters]);

  const page = result?.key === searchKey ? result : null;
  const errorMessage = error?.key === searchKey ? error.message : null;

  const loadMore = async () => {
    if (!page) return;
    setIsLoadingMore(true);
    try {
      const next = await searchProducts(q, filters, page.products.length, PAGE_SIZE);
      // append only if the search hasn't changed meanwhile
      setResult((prev) =>
        prev && prev.key === searchKey
          ? { ...prev, products: [...prev.products, ...next.products], total: next.total }
          : prev,
      );
    } catch (err) {
      setError({ key: searchKey, message: toApiError(err).message });
    } finally {
      setIsLoadingMore(false);
    }
  };

  // writes q + the filters to the URL; the effect above re-runs the search
  const applyFilters = (next: ProductFilters) => {
    const nextParams = new URLSearchParams({ q });
    for (const key of FILTER_KEYS) {
      if (next[key] !== undefined) nextParams.set(key, String(next[key]));
    }
    setParams(nextParams);
  };

  return (
    <div className="min-h-svh bg-white font-sans text-ink antialiased">
      <Header />

      <main className="bg-surface pt-14 pb-24">
        <div className="mx-auto max-w-300 px-4 xl:px-0">
          {!q ? (
            <div className="flex flex-col items-center rounded-2xl bg-white px-4 py-20 text-center">
              <h1 className="text-xl font-semibold">Search for products</h1>
              <p className="mt-2 text-[15px] text-muted">Type a product name in the search bar and press Enter.</p>
            </div>
          ) : (
            <>
              <span className="text-[13px] font-semibold tracking-[3.5px] text-brand uppercase">Search results</span>
              <h1 className="mt-3.5 text-4xl leading-[1.1] font-bold tracking-[-1.4px] break-words md:text-5xl">
                “{q}”
              </h1>
              <p className="mt-3 text-sm text-muted">
                {page ? `${page.total.toLocaleString()} ${page.total === 1 ? "product" : "products"}` : " "}
              </p>

              <div className="mt-8">
                <ProductFiltersBar
                  key={filtersKey(filters)}
                  applied={filters}
                  onApply={applyFilters}
                  onClear={() => applyFilters({})}
                />
              </div>

              {errorMessage && (
                <p role="alert" className="mt-8 rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
                  {errorMessage}
                </p>
              )}

              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                {page
                  ? page.products.map((p) => (
                      <ProductCard key={p._id} product={p} categoryName={p.category_id?.name ?? ""} />
                    ))
                  : !errorMessage && Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
              </div>

              {page && page.total === 0 && (
                <div className="mt-8 flex flex-col items-center gap-4 text-center">
                  <p className="text-muted">
                    {hasFilters(filters)
                      ? `No products named “${q}” match these filters.`
                      : `No products found for “${q}”. Try a different word.`}
                  </p>
                  {!hasFilters(filters) && (
                    <Link to="/" className="text-sm font-semibold text-brand hover:underline">
                      Browse departments
                    </Link>
                  )}
                </div>
              )}

              {page && page.total > 0 && (
                <div className="mt-12 flex flex-col items-center gap-4">
                  <p className="text-sm text-muted">
                    Showing {page.products.length} of {page.total.toLocaleString()} products
                  </p>
                  <div className="h-1 w-60 overflow-hidden rounded-full bg-line">
                    <div className="h-full bg-brand" style={{ width: `${(page.products.length / page.total) * 100}%` }} />
                  </div>
                  {page.products.length < page.total && (
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="h-12 rounded-[10px] border border-ink bg-white px-7 text-[15px] font-semibold transition hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoadingMore ? "Loading..." : "Load more products"}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
