/*
 * Journal — src/app/(public)/DepartmentHome.tsx
 *
 * 2026-10-08 (Claude): Created from design/department-home.html. Public landing page at "/" (no login needed).
 *   Flow: load departments → open the first one → load its categories → open the first category → load its
 *   products 12 at a time ("Load more" appends the next 12 using offset = products already shown).
 *   Clicking a department tab or category chip switches the view.
 *   Loading is derived, not stored: categories/products are saved together with the id they were fetched for,
 *   and the view is "loading" while that id doesn't match the selected one. This also means a slow response
 *   for a previously selected department/category can never overwrite the current one.
 *   Not wired yet (visual only): search, wishlist, cart, footer links. Left out of the design: "All departments"
 *   button, "All" chip and Sort (no API for them), rating counts (not in the Product model), card wishlist heart.
 *   Prices are shown in USD because the seeded Amazon dataset is in dollars.
 *
 * 2026-10-08 (Claude): Brand and Header moved to components/Header.tsx (shared with other pages; the header now
 *   shows Guest/Sign in or the logged-in user, and cart/wishlist link to their pages). Imported from there.
 *
 * 2026-10-09 (Claude): ProductCard, SkeletonCard and Footer moved to components/ (shared with the product page);
 *   the usd formatter moved to lib/format.ts. Product cards now link to /product/:id.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { ProductCard, SkeletonCard } from "../../components/ProductCard";
import { toApiError } from "../../lib/api_error";
import {
  getCategories,
  getDepartments,
  getProducts,
  type Category,
  type Department,
  type Product,
} from "../../services/dashboard.service";

const PAGE_SIZE = 12;
const VISIBLE_CHIPS = 8;

// ---------- Page ----------

export default function DepartmentHome() {
  const [departments, setDepartments] = useState<Department[] | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // each result remembers which id it was fetched for (see journal: loading is derived from this)
  const [categoryList, setCategoryList] = useState<{ departmentId: string; categories: Category[] } | null>(null);
  const [productPage, setProductPage] = useState<{ categoryId: string; products: Product[]; total: number } | null>(null);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showAllChips, setShowAllChips] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. departments → open the first one
  useEffect(() => {
    let ignore = false;
    getDepartments()
      .then((list) => {
        if (ignore) return;
        setDepartments(list);
        setDepartmentId(list[0]?._id ?? null);
      })
      .catch((err) => !ignore && setError(toApiError(err).message));
    return () => {
      ignore = true;
    };
  }, []);

  // 2. categories of the selected department → open the first one
  useEffect(() => {
    if (!departmentId) return;
    let ignore = false;
    getCategories(departmentId)
      .then((categories) => {
        if (ignore) return;
        setCategoryList({ departmentId, categories });
        setCategoryId(categories[0]?._id ?? null);
      })
      .catch((err) => !ignore && setError(toApiError(err).message));
    return () => {
      ignore = true;
    };
  }, [departmentId]);

  // 3. first page of products of the selected category
  useEffect(() => {
    if (!categoryId) return;
    let ignore = false;
    getProducts(categoryId, 0, PAGE_SIZE)
      .then(({ products, total }) => {
        if (!ignore) setProductPage({ categoryId, products, total });
      })
      .catch((err) => !ignore && setError(toApiError(err).message));
    return () => {
      ignore = true;
    };
  }, [categoryId]);

  const selectDepartment = (id: string) => {
    if (id === departmentId) return;
    setDepartmentId(id);
    setCategoryId(null); // the old category belongs to the old department
    setShowAllChips(false);
    setError(null);
  };

  const selectCategory = (id: string) => {
    setCategoryId(id);
    setError(null);
  };

  const loadMore = async () => {
    if (!productPage) return;
    const forCategory = productPage.categoryId;
    setIsLoadingMore(true);
    try {
      const next = await getProducts(forCategory, productPage.products.length, PAGE_SIZE);
      // append only if the user is still on the same category
      setProductPage((prev) =>
        prev && prev.categoryId === forCategory
          ? { ...prev, products: [...prev.products, ...next.products], total: next.total }
          : prev,
      );
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const department = departments?.find((d) => d._id === departmentId);
  const categories = categoryList?.departmentId === departmentId ? categoryList.categories : null;
  const category = categories?.find((c) => c._id === categoryId);
  const page = productPage && productPage.categoryId === categoryId ? productPage : null;

  const visibleCategories = categories && !showAllChips ? categories.slice(0, VISIBLE_CHIPS) : categories;
  const hiddenChipCount = categories ? categories.length - VISIBLE_CHIPS : 0;

  return (
    <div className="min-h-svh bg-white font-sans text-ink antialiased">
      <Header />

      {/* Department tabs */}
      <nav aria-label="Departments" className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-300 gap-7 overflow-x-auto px-4 scrollbar:none xl:px-0">
          {departments?.map((d) => (
            <button
              key={d._id}
              type="button"
              onClick={() => selectDepartment(d._id)}
              aria-current={d._id === departmentId ? "page" : undefined}
              className={`shrink-0 border-b-2 py-3.5 text-sm whitespace-nowrap ${
                d._id === departmentId
                  ? "border-brand font-semibold text-ink"
                  : "border-transparent font-medium text-muted hover:text-ink"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(115deg,#0b1220_0%,#05070c_55%,#000_100%)] text-white">
        <div className="pointer-events-none absolute -top-40 -right-30 size-160 bg-[radial-gradient(circle,rgba(255,107,44,0.45)_0%,rgba(255,107,44,0)_65%)]" />
        <div className="relative mx-auto max-w-300 px-4 pt-24 pb-22 xl:px-0">
          <span className="inline-flex items-center gap-3 text-sm font-semibold tracking-[4px] text-[#ffb08c] uppercase">
            <span className="size-2 rounded-full bg-brand" />
            Shopistan Department
          </span>
          <h1 className="mt-5 text-5xl leading-[1.05] font-bold tracking-[-2.4px] md:text-[80px]">
            {department?.name ?? " "}
          </h1>
          <p className="mt-4 text-base text-subtle">{categories ? `${categories.length} categories` : " "}</p>
          <nav aria-label="Breadcrumb" className="mt-8 flex gap-2.5 text-[15px] text-subtle">
            <Link to="/" className="text-white">Home</Link>
            <span className="text-gray-600">/</span>
            <span>{department?.name}</span>
          </nav>
        </div>
      </section>

      {/* Explore products */}
      <main className="bg-surface pt-20 pb-24">
        <div className="mx-auto max-w-300 px-4 xl:px-0">
          <span className="text-[13px] font-semibold tracking-[3.5px] text-brand uppercase">Explore products</span>
          <h2 className="mt-3.5 text-4xl leading-[1.1] font-bold tracking-[-1.4px] md:text-5xl">
            {category?.name ?? " "}
          </h2>

          {/* Category chips */}
          <div className="mt-8 flex flex-wrap gap-2.5">
            {visibleCategories?.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => selectCategory(c._id)}
                aria-pressed={c._id === categoryId}
                className={`inline-flex h-9.5 items-center rounded-full border px-4 text-sm font-medium ${
                  c._id === categoryId
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-white text-ink hover:border-ink"
                }`}
              >
                {c.name}
              </button>
            ))}
            {hiddenChipCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllChips((v) => !v)}
                className="inline-flex h-9.5 items-center rounded-full border border-dashed border-[#fdc5ab] bg-white px-4 text-sm font-medium text-brand"
              >
                {showAllChips ? "Show less" : `+${hiddenChipCount} more`}
              </button>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-8 rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          {/* Product grid */}
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {page
              ? page.products.map((p) => <ProductCard key={p._id} product={p} categoryName={category?.name ?? ""} />)
              : !error && Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
          </div>

          {page && page.total === 0 && (
            <p className="mt-8 text-center text-muted">No products in this category yet.</p>
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
