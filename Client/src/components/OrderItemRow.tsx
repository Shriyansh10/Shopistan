import { Link } from "react-router";
import { usd } from "../lib/format";

type OrderItemRowProps = {
  name: string;
  quantity: number;
  lineTotal: number;
  image?: string | null;
  productId?: string | null;
};

export default function OrderItemRow({ name, quantity, lineTotal, image, productId }: OrderItemRowProps) {
  const tile = (
    <div className="grid h-15.5 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-gray-100 p-1.5">
      {/* multiply blends the product photo's white background into the grey tile */}
      {image && <img src={image} alt="" loading="lazy" className="max-h-full max-w-full object-contain mix-blend-multiply" />}
    </div>
  );

  return (
    <div className="flex items-start gap-3">
      {productId ? <Link to={`/product/${productId}`}>{tile}</Link> : tile}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {productId ? (
          <Link to={`/product/${productId}`} title={name} className="line-clamp-2 text-[13px] leading-[1.35] font-medium hover:underline">
            {name}
          </Link>
        ) : (
          <p title={name} className="line-clamp-2 text-[13px] leading-[1.35] font-medium">{name}</p>
        )}
        <p className="text-xs leading-[1.3] text-muted">Qty {quantity}</p>
      </div>
      <p className="shrink-0 text-sm leading-[1.2] font-semibold">{usd.format(lineTotal)}</p>
    </div>
  );
}
