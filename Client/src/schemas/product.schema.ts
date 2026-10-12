import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a product name").max(300, "Name is too long"),
  image: z
    .string()
    .trim()
    .min(1, "Paste a link to the product image")
    .pipe(z.url({ protocol: /^https?$/, error: "Enter a link starting with http:// or https://" }))
    .pipe(z.string().max(2048, "Link is too long")),
  price: z.number({ error: "Enter a price" }).min(0, "Price can't be negative"),
  discount: z.number({ error: "Enter a discount (0 for none)" }).min(0, "Min 0%").max(100, "Max 100%"),
  department_id: z.string().min(1, "Choose a department"),
  category_id: z.string().min(1, "Choose a category"),
  description: z.string().trim().max(5000, "Description is too long").optional(),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;
