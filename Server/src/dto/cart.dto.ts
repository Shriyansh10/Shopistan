import {z} from "zod";

export const quantityDto = z.object({
    quantity: z.number().int().min(1).max(10),
});

export type QuantityType = z.infer<typeof quantityDto>;
