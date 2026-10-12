import type { z } from "zod";
import { badRequest } from "./api-error.js";

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

// validates req.query against a zod schema and returns the parsed values; 400 in the same shape as validateMiddleware
export const parseQuery = <T extends z.ZodType>(schema: T, query: unknown): z.infer<T> => {
  const result = schema.safeParse(query);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")} - ${i.message}`);
    throw badRequest(`Validation failed: ${issues.join(", ")}`, result.error.issues);
  }
  return result.data;
};
