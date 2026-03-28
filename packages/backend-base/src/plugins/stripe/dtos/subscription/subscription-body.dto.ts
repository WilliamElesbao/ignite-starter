import { t } from "elysia";

export const SubscriptionBodyDto = t.Object({
  priceId: t.String(),
  planName: t.String(),
});

export type TSubscriptionBodyDto = typeof SubscriptionBodyDto.static;
