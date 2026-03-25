import { z } from "zod";

/**
 * DTO returned by the Stripe Checkout Session creation endpoint.
 */
export const SubscriptionResponseDto = z.object({
  url: z.url(),
});

export type SubscriptionResponseDto = z.infer<typeof SubscriptionResponseDto>;
