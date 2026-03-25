import { z } from "zod";

/**
 * DTO for creating or updating a subscription.
 */
export const SubscriptionPayloadDto = z.object({
  priceId: z.string(),
  planName: z.string(),
  userId: z.string(),
});

export type SubscriptionPayloadDto = z.infer<typeof SubscriptionPayloadDto>;
