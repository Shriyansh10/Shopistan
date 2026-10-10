/*
 * Journal — src/components/ProductCard.tsx
 *
 * 2026-10-09 (Claude): Created. ProductCard and SkeletonCard moved here from app/(public)/DepartmentHome.tsx so
 *   the home grid and the product page's "More from this category" carousel share them. The card is now a
 *   link to the product page (/product/:id). Prices come from lib/format.ts.
 */

import { Link } from "react-router";
import { sellingPrice, usd } from "../lib/format";
import type { Product } from "../services/dashboard.service";

type ProductCardProps = {
  product: Product;
  categoryName: string;
};

export function ProductCard({ product, categoryName }: ProductCardProps) {
  return (
    <Link
      to={`/product/${product._id}`}
      className="flex flex-col rounded-2xl border border-line bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(17,24,39,0.08)]"
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
          <span className="text-lg font-bold">{usd.format(sellingPrice(product.price, product.discount))}</span>
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
