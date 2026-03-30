import { t } from "elysia";

const STRIPE_SUBSCRIPTION_STATUS = [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
] as const;

const STRIPE_INTERVAL = ["day", "week", "month", "year"] as const;

const StripeSubscriptionStatusEnum = t.String({
  enum: STRIPE_SUBSCRIPTION_STATUS,
});

const StripeIntervalEnum = t.String({
  enum: STRIPE_INTERVAL,
});

const StripeCustomer = t.Union([t.String(), t.Object({})]); // Simplified customer type

const SubscriptionDetailsDataDto = t.Object({
  hasActiveSubscription: t.Boolean(),
  code: t.Optional(t.String()),
  message: t.Optional(t.String()),
  id: t.Optional(t.String()),
  status: t.Optional(StripeSubscriptionStatusEnum),
  current_period_start: t.Optional(t.String()),
  current_period_end: t.Optional(t.String()),
  cancel_at_period_end: t.Optional(t.Boolean()),
  customer: t.Optional(StripeCustomer),
  created: t.Optional(t.String()),
  plan: t.Optional(
    t.Object({
      priceId: t.String(),
      amount: t.Nullable(t.Number()),
      currency: t.String(),
      interval: t.Optional(StripeIntervalEnum),
    }),
  ),
  product: t.Optional(
    t.Object({
      id: t.String(),
      name: t.String(),
      description: t.Nullable(t.String()),
    }),
  ),
});

export const SubscriptionDetailsResponseDto = SubscriptionDetailsDataDto;
