import { t } from "elysia";

export const SubscriptionResponseDto = t.Object({
  url: t.Nullable(t.String()),
});
