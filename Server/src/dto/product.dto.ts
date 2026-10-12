import { z } from "zod";

export const addReviewDto = z.object({
  rating: z.number().int().min(1).max(5),
  // "" or "   " after trim becomes undefined, so empty comments aren't stored
  comment: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((c) => c || undefined),
  // no `images` until photo upload exists — any `images` sent is stripped (the model keeps its default [])
});
export type AddReviewType = z.infer<typeof addReviewDto>;

export const productDto = z.object({
  name: z.string().trim().min(1).max(300),
  image: z.url({ protocol: /^https?$/ }).max(2048), // a link to the image, no upload
  price: z.number().min(0),
  discount: z.number().min(0).max(100).default(0), // % off
  category_id: z.string().regex(/^[0-9a-f]{24}$/i, "Invalid category ID"),
  description: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .transform((d) => d || undefined),
});
export type ProductType = z.infer<typeof productDto>;

// a number from the URL (strings there, so z.coerce); missing or "" / "  " means "not sent"
// (without the preprocess, z.coerce turns "" into 0)
const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce.number().pipe(schema).optional(),
  );

// the three filters (price range, rating, discount) — used by search AND the category listing
const productFilterFields = {
  min_price: optionalNumber(z.number().min(0)),
  max_price: optionalNumber(z.number().min(0)),
  min_rating: optionalNumber(z.number().min(0).max(5)),     // 4 → "4★ & up"
  min_discount: optionalNumber(z.number().min(0).max(100)), // 10 → "10% off or more"
};

// "| undefined" because zod's optional fields give number | undefined (exactOptionalPropertyTypes is on)
const priceRangeIsValid = (f: { min_price?: number | undefined; max_price?: number | undefined }) =>
  f.min_price === undefined || f.max_price === undefined || f.min_price <= f.max_price;
const priceRangeError = { message: "min_price can't be more than max_price", path: ["min_price"] };

// GET /api/dashboard/categories/:categoryId/products
export const productFiltersDto = z.object(productFilterFields).refine(priceRangeIsValid, priceRangeError);
export type ProductFiltersType = z.infer<typeof productFiltersDto>;

// GET /api/dashboard/products/search — the same filters + q
export const searchProductsDto = z
  .object({ q: z.string().trim().min(1, "Enter something to search").max(100), ...productFilterFields })
  .refine(priceRangeIsValid, priceRangeError);
export type SearchProductsType = z.infer<typeof searchProductsDto>;


