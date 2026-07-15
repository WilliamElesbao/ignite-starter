import { z } from "zod";

const subscriptionSchema = z.object({
  priceId: z.string(),
  planName: z.string(),
  subscriptionId: z.string().optional(),
});

export type SubscriptionSchema = z.infer<typeof subscriptionSchema>;
