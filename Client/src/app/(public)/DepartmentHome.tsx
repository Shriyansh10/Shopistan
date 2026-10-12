import { useEffect, useState } from "react";
import { Link } from "react-router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { ProductCard, SkeletonCard } from "../../components/ProductCard";
import ProductFormModal from "../../components/ProductFormModal";
import ProductFiltersBar from "../../components/ProductFiltersBar";
import { filtersKey, hasFilters, type ProductFilters } from "../../lib/product_filters";
import { toApiError } from "../../lib/api_error";
import {
  getCategories,
  getDepartments,
  getProducts,
  type Category,
  type Department,
  type Product,
} from "../../services/dashboard.service";
import { deleteProduct, type SavedProduct } from "../../services/product.service";

const PAGE_SIZE = 12;
const VISIBLE_CHIPS = 8;

// ---------- Page ----------

export default function DepartmentHome() {
  const [departments, setDepartments] = useState<Department[] | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // each result remembers which id it was fetched for: the view is "loading" while that id doesn't match the
  // selected one, and a slow response for an earlier selection can never overwrite the current one
  const [categoryList, setCategoryList] = useState<{ departmentId: string; categories: Category[] } | null>(null);
  const [productPage, setProductPage] = useState<{
    categoryId: string;
    filtersKey: string;
    products: Product[];
    total: number;
  } | null>(null);
  // applied filters (the bar keeps its own unapplied inputs)
  const [filters, setFilters] = useState<ProductFilters>({});

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showAllChips, setShowAllChips] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

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

  // 3. first page of products of the selected category, with the applied filters
  useEffect(() => {
    if (!categoryId) return;
    let ignore = false;
    getProducts(categoryId, 0, PAGE_SIZE, filters)
      .then(({ products, total }) => {
        if (!ignore) setProductPage({ categoryId, filtersKey: filtersKey(filters), products, total });
      })
      .catch((err) => !ignore && setError(toApiError(err).message));
    return () => {
      ignore = true;
    };
  }, [categoryId, filters]);

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
    const forFilters = productPage.filtersKey;
    setIsLoadingMore(true);
    try {
      const next = await getProducts(forCategory, productPage.products.length, PAGE_SIZE, filters);
      // append only if the user is still on the same category with the same filters
      setProductPage((prev) =>
        prev && prev.categoryId === forCategory && prev.filtersKey === forFilters
          ? { ...prev, products: [...prev.products, ...next.products], total: next.total }
          : prev,
      );
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // admin: put the saved product back into the grid (or take it out if it moved to another category)
  const handleProductSaved = (saved: SavedProduct) => {
    setEditingProductId(null);
    setProductPage((prev) => {
      if (!prev) return prev;
      if (saved.category_id !== prev.categoryId) {
        return { ...prev, products: prev.products.filter((p) => p._id !== saved._id), total: prev.total - 1 };
      }
      return { ...prev, products: prev.products.map((p) => (p._id === saved._id ? { ...p, ...saved } : p)) };
    });
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    setError(null);
    try {
      await deleteProduct(product._id);
      setProductPage((prev) =>
        prev && { ...prev, products: prev.products.filter((p) => p._id !== product._id), total: prev.total - 1 },
      );
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const department = departments?.find((d) => d._id === departmentId);
  const categories = categoryList?.departmentId === departmentId ? categoryList.categories : null;
  const category = categories?.find((c) => c._id === categoryId);
  const page =
    productPage && productPage.categoryId === categoryId && productPage.filtersKey === filtersKey(filters)
      ? productPage
      : null;

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

          {/* Filters — stay applied across categories */}
          <div className="mt-6">
            <ProductFiltersBar
              key={filtersKey(filters)}
              applied={filters}
              onApply={(next) => {
                setFilters(next);
                setError(null);
              }}
              onClear={() => {
                setFilters({});
                setError(null);
              }}
            />
          </div>

          {error && (
            <p role="alert" className="mt-8 rounded-[10px] bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          {/* Product grid */}
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {page
              ? page.products.map((p) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    categoryName={category?.name ?? ""}
                    onEdit={(product) => setEditingProductId(product._id)}
                    onDelete={handleDelete}
                  />
                ))
              : !error && Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
          </div>

          {page && page.total === 0 && (
            <p className="mt-8 text-center text-muted">
              {hasFilters(filters) ? "No products in this category match these filters." : "No products in this category yet."}
            </p>
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

      {editingProductId && (
        <ProductFormModal
          productId={editingProductId}
          onClose={() => setEditingProductId(null)}
          onSaved={handleProductSaved}
        />
      )}
    </div>
  );
}
