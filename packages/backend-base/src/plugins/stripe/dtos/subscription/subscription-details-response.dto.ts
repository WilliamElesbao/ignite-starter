import { type Static, t } from "elysia";

export const SubscriptionDetailsResponseDto = t.Object({
  tier: t.Union([t.Literal("free"), t.Literal("pro")]),
  status: t.Union([
    t.Literal("free"),
    t.Literal("active"),
    t.Literal("canceling"),
    t.Literal("whitelisted"),
  ]),
  periodEnd: t.Optional(t.String({ format: "date-time" })),
  isProAccess: t.Boolean(),
  stripeSubscriptionId: t.Optional(t.String()),
});

export type SubscriptionDetailsResponse = Static<
  typeof SubscriptionDetailsResponseDto
>;
