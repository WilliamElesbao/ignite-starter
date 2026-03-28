import { t } from "elysia";

/**
 * {
    "id": "sub_1TFzX6Dj31fYLKFP3KPsqmWb",
    "status": "active",
    "current_period_start": "2026-03-28T16:30:59.000Z",
    "current_period_end": "2026-09-28T16:30:59.000Z",
    "cancel_at_period_end": false,
    "customer": "cus_UESRmQ45e77dJO",
    "created": "2026-03-28T16:16:18.000Z",
    "plan": {
        "priceId": "price_1TEFrJDj31fYLKFPz0F5MIcp",
        "amount": 2500,
        "currency": "usd",
        "interval": "month"
    },
    "product": {
        "id": "prod_UCfBp9mZb5TWCT",
        "name": "Premium",
        "description": "Best Seller"
    }
}
 */
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
  message: t.Optional(t.String()),
  id: t.Optional(t.String()),
  status: t.Optional(StripeSubscriptionStatusEnum),
  current_period_start: t.Optional(t.String()),
  current_period_end: t.Optional(t.String()),
  cancel_at_period_end: t.Optional(t.Boolean()),
  customer: t.Optional(StripeCustomer),
  created: t.Optional(t.String()),
  plan: t.Optional(t.Object({
    priceId: t.String(),
    amount: t.Nullable(t.Number()),
    currency: t.String(),
    interval: t.Optional(StripeIntervalEnum),
  })),
  product: t.Optional(t.Object({
    id: t.String(),
    name: t.String(),
    description: t.Nullable(t.String()),
  })),
});

export const SubscriptionDetailsResponseDto = SubscriptionDetailsDataDto;
