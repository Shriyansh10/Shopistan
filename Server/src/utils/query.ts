/*
 * Journal — src/utils/query.ts
 *
 * 2026-10-09 (Claude): Created. Moved toInt() here from controllers/dashboard.controller.ts and added
 *   getPagination(), so every paginated endpoint (products by category, product reviews) validates
 *   ?offset= / ?limit= the same way.
 *   Usage: const { offset, limit } = getPagination(req.query);
 */

// Parses a query value as an integer ≥ min; anything else (missing, "abc", "-5", ?x=1&x=2) gives the fallback
export const toInt = (value: unknown, fallback: number, min: number) => {
  const n = typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(n) && n >= min ? n : fallback;
};

// limit: 1–maxLimit (default 10), offset: 0 or more (default 0); bad values fall back to the default
export const getPagination = (query: { offset?: unknown; limit?: unknown }, maxLimit = 50) => ({
  offset: toInt(query.offset, 0, 0),
  limit: Math.min(toInt(query.limit, 10, 1), maxLimit),
});
