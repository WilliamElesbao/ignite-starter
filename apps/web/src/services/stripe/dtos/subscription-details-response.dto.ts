import { z } from "zod";

/**
 * DTO for the response containing subscription details.
 */
export const SubscriptionDetailsResponseDto = z.object({
  id: z.string(),
  status: z.string(),
  current_period_start: z.string(),
  current_period_end: z.string(),
  cancel_at_period_end: z.boolean(),
  created: z.number(),
  plan: z.object({
    priceId: z.string(),
    amount: z.number(),
    currency: z.string(),
    interval: z.string(),
  }),
  product: z.object({
    id: z.string(),
    name: z.string(),
    description: z.nullable(z.string()),
  }),
});

export type SubscriptionDetailsResponseDto = z.infer<
  typeof SubscriptionDetailsResponseDto
>;
