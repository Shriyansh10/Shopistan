export type ProductFilters = {
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  min_discount?: number;
};

export const FILTER_KEYS = ["min_price", "max_price", "min_rating", "min_discount"] as const;

export function filtersFromParams(params: URLSearchParams): ProductFilters {
  const filters: ProductFilters = {};
  for (const key of FILTER_KEYS) {
    const raw = params.get(key);
    if (raw === null || raw.trim() === "") continue;
    const value = Number(raw);
    if (Number.isFinite(value) && value >= 0) filters[key] = value;
  }
  return filters;
}

export function hasFilters(filters: ProductFilters) {
  return FILTER_KEYS.some((key) => filters[key] !== undefined);
}

export function filtersKey(filters: ProductFilters) {
  return FILTER_KEYS.map((key) => filters[key] ?? "").join("|");
}
