import { Link } from "react-router";
import { useAuth } from "../context/auth.context";
import { sellingPrice, usd } from "../lib/format";
import type { Product } from "../services/dashboard.service";

type ProductCardProps = {
  product: Product;
  categoryName: string;
  // admin actions; the buttons only show for admins when these are passed
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
};

const adminButtonClass =
  "grid size-8.5 place-items-center rounded-[9px] border border-line bg-white/95 shadow-sm transition disabled:opacity-60";

export function ProductCard({ product, categoryName, onEdit, onDelete }: ProductCardProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="relative rounded-2xl transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(17,24,39,0.08)]">
      <Link
        to={`/product/${product._id}`}
        className="flex h-full flex-col rounded-2xl border border-line bg-white p-3"
      >
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
            <span className="text-lg font-bold">{usd.format(product.selling_price ?? sellingPrice(product.price, product.discount))}</span>
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
      </Link>

      {isAdmin && (onEdit || onDelete) && (
        <div className="absolute top-5 right-5 flex gap-1.5">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(product)}
              aria-label={`Edit ${product.name}`}
              title="Edit"
              className={`${adminButtonClass} text-ink hover:border-ink`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(product)}
              aria-label={`Delete ${product.name}`}
              title="Delete"
              className={`${adminButtonClass} text-danger hover:border-danger`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="flex animate-pulse flex-col gap-3 rounded-2xl border border-line bg-white p-3">
      <div className="aspect-square rounded-[10px] bg-gray-100" />
      <div className="h-3 w-1/2 rounded bg-gray-100" />
      <div className="h-4 w-full rounded bg-gray-100" />
      <div className="h-5 w-1/3 rounded bg-gray-100" />
    </div>
  );
}
