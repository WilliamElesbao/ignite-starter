import { z } from "zod";

/**
 * DTO representing a simplified response from the Stripe subscription update endpoint.
 */
export const UpdateSubscriptionResponseDto = z.object({
  updated: z.object({
    id: z.string(),
    status: z.string(),
    customer: z.string(),
    currency: z.string(),
    plan: z.object({
      id: z.string(),
      amount: z.number(),
      currency: z.string(),
      interval: z.string(),
      interval_count: z.number(),
    }),
    items: z.object({
      data: z.array(
        z.object({
          id: z.string(),
          price: z.object({
            id: z.string(),
            amount: z.number().optional(),
            currency: z.string(),
            recurring: z.object({
              interval: z.string(),
              interval_count: z.number(),
              usage_type: z.string(),
            }),
          }),
        }),
      ),
    }),
    latest_invoice: z.string().optional(),
    metadata: z.object({
      planName: z.string().optional(),
      userId: z.string().optional(),
    }),
  }),
});

export type UpdateSubscriptionResponseDto = z.infer<
  typeof UpdateSubscriptionResponseDto
>;
