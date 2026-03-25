import { z } from "zod";

/**
 * DTO representing a Stripe product response.
 */
export const ProductDto = z.object({
  id: z.string(),
  planName: z.string(),
  currency: z.string(),
  price: z.number(),
  recurring: z
    .object({
      interval: z.string(),
      interval_count: z.number(),
      meter: z.any().nullable(),
      trial_period_days: z.number().nullable(),
      usage_type: z.string(),
    })
    .nullable(),
});

export const ProductListDto = z.array(ProductDto);

export type ProductDto = z.infer<typeof ProductDto>;
export type ProductListDto = z.infer<typeof ProductListDto>;
