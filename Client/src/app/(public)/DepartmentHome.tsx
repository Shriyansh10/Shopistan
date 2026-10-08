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
 */

import { useEffect, useState } from "react";
import { Link } from "react-router";
import Header, { Brand } from "../../components/Header";
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

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

// ---------- Small pieces ----------

function ProductCard({ product, categoryName }: { product: Product; categoryName: string }) {
  // price is the original price; discount is % off it
  const selling = product.price * (1 - product.discount / 100);

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(17,24,39,0.08)]">
      <div className="grid aspect-square place-items-center overflow-hidden rounded-[10px] bg-gray-100 p-4">
        {/* multiply blends the product photo's white background into the grey tile */}
        <img src={product.image} alt="" loading="lazy" className="max-h-full max-w-full object-contain mix-blend-multiply" />
      </div>
      <div className="flex flex-col gap-2 px-1 pt-3.5 pb-1">
        <span className="text-xs text-subtle">{categoryName}</span>
        <h3 className="line-clamp-2 min-h-10 text-[15px] leading-[1.35] font-medium" title={product.name}>
          {product.name}
        </h3>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-bold">{usd.format(selling)}</span>
          {product.discount > 0 && (
            <>
              <span className="text-[13px] text-subtle line-through">{usd.format(product.price)}</span>
              <span className="text-[13px] font-semibold text-success">{product.discount}% off</span>
            </>
          )}
        </div>
        {product.rating > 0 && (
          <div className="flex items-center gap-1.5 text-[13px] text-muted">
            <span className="text-amber-500">★</span>
            {product.rating.toFixed(1)}
          </div>
        )}
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="flex animate-pulse flex-col gap-3 rounded-2xl border border-line bg-white p-3">
      <div className="aspect-square rounded-[10px] bg-gray-100" />
      <div className="h-3 w-1/2 rounded bg-gray-100" />
      <div className="h-4 w-full rounded bg-gray-100" />
      <div className="h-5 w-1/3 rounded bg-gray-100" />
    </div>
  );
}

function Footer() {
  const columns = [
    { title: "Shop", items: ["New arrivals", "Best sellers", "Deals", "Gift cards"] },
    { title: "Help", items: ["Track order", "Returns", "Shipping", "Contact us"] },
    { title: "Company", items: ["About", "Careers", "Press", "Privacy"] },
  ];

  return (
    <footer className="bg-ink pt-18 pb-10 text-subtle">
      <div className="mx-auto max-w-300 px-4 xl:px-0">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-2 text-white md:col-span-1">
            <Brand />
            <p className="mt-4 text-sm text-subtle">Everyday essentials, delivered fast across India.</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-semibold text-white">{col.title}</h4>
              {col.items.map((item) => (
                <p key={item} className="mb-3 text-sm">{item}</p>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-gray-800 pt-7 text-[13px]">
          <span>© 2026 Shopistan. All rights reserved.</span>
          <div className="flex gap-2">
            {["VISA", "UPI", "MCARD", "COD"].map((p) => (
              <span key={p} className="grid h-6.5 place-items-center rounded-md bg-gray-800 px-3 text-[11px] font-semibold text-gray-300">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

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
        <div className="mx-auto flex max-w-300 gap-7 overflow-x-auto px-4 [scrollbar-width:none] xl:px-0">
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
