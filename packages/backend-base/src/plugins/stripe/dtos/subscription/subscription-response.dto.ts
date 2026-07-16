import { t } from "elysia";

export const SubscriptionResponseDto = t.Object({
  url: t.Optional(t.String({ format: "uri" })),
});
