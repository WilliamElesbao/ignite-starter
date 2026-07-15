import { t } from "elysia";

export const SubscriptionDetailsResponseDto = t.Object({
  tier: t.Union([t.Literal("free"), t.Literal("pro")]),
  status: t.String({ enum: ["free", "active", "canceling", "whitelisted"] }),
  periodEnd: t.Nullable(t.Date({ format: "date-time" })),
  isProAccess: t.Boolean(),
  stripeSubscriptionId: t.Nullable(t.String()),
});
