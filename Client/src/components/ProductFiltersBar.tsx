import { useState, type FormEvent } from "react";
import { filtersKey, hasFilters, type ProductFilters } from "../lib/product_filters";

const RATING_OPTIONS = [
  { value: "", label: "Any rating" },
  { value: "4", label: "4★ & up" },
  { value: "3", label: "3★ & up" },
  { value: "2", label: "2★ & up" },
];

const DISCOUNT_OPTIONS = [
  { value: "", label: "Any discount" },
  { value: "10", label: "10% off or more" },
  { value: "25", label: "25% off or more" },
  { value: "50", label: "50% off or more" },
  { value: "70", label: "70% off or more" },
];

const fieldClass =
  "h-10 rounded-[9px] border border-line bg-white px-3 text-sm text-ink outline-none transition placeholder:text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-danger";

// inputs hold text; "" means "not set"
type Draft = Record<keyof ProductFilters, string>;

const toDraft = (f: ProductFilters): Draft => ({
  min_price: f.min_price?.toString() ?? "",
  max_price: f.max_price?.toString() ?? "",
  min_rating: f.min_rating?.toString() ?? "",
  min_discount: f.min_discount?.toString() ?? "",
});

const fromDraft = (d: Draft): ProductFilters => {
  const filters: ProductFilters = {};
  for (const key of Object.keys(d) as (keyof Draft)[]) {
    const value = d[key].trim() === "" ? NaN : Number(d[key]);
    if (Number.isFinite(value) && value >= 0) filters[key] = value;
  }
  return filters;
};

type ProductFiltersBarProps = {
  applied: ProductFilters;
  onApply: (filters: ProductFilters) => void;
  onClear: () => void;
};

export default function ProductFiltersBar({ applied, onApply, onClear }: ProductFiltersBarProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(applied));
  const [error, setError] = useState<string | null>(null);

  const next = fromDraft(draft);
  const isChanged = filtersKey(next) !== filtersKey(applied);

  const set = (key: keyof Draft) => (value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (next.min_price !== undefined && next.max_price !== undefined && next.min_price > next.max_price) {
      setError("Min price can't be more than max price");
      return;
    }
    onApply(next);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Filter products"
      className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-xl border border-line bg-white p-4"
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">Price (USD)</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Min"
            aria-label="Minimum price"
            aria-invalid={!!error}
            value={draft.min_price}
            onChange={(e) => set("min_price")(e.target.value)}
            className={`${fieldClass} w-24`}
          />
          <span className="text-subtle">–</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Max"
            aria-label="Maximum price"
            aria-invalid={!!error}
            value={draft.max_price}
            onChange={(e) => set("max_price")(e.target.value)}
            className={`${fieldClass} w-24`}
          />
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">Rating</span>
        <select value={draft.min_rating} onChange={(e) => set("min_rating")(e.target.value)} className={fieldClass}>
          {RATING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted">Discount</span>
        <select value={draft.min_discount} onChange={(e) => set("min_discount")(e.target.value)} className={fieldClass}>
          {DISCOUNT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>

      <div className="flex gap-2.5">
        <button
          type="submit"
          disabled={!isChanged}
          className="h-10 rounded-[10px] bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Apply filters
        </button>
        {hasFilters(applied) && (
          <button
            type="button"
            onClick={onClear}
            className="h-10 rounded-[10px] border border-line px-4 text-sm font-semibold transition hover:border-ink"
          >
            Remove filters
          </button>
        )}
      </div>

      {error && <p role="alert" className="w-full text-xs text-danger">{error}</p>}
    </form>
  );
}
