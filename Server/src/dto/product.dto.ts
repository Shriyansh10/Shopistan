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
