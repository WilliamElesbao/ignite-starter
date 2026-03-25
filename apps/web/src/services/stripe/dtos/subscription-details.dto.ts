import { z } from "zod";

/**
 * DTO for retrieving subscription details.
 */
export const SubscriptionDetailsPayloadDto = z.object({
  stripeSubscriptionId: z.string(),
});

export type SubscriptionDetailsPayloadDto = z.infer<
  typeof SubscriptionDetailsPayloadDto
>;
