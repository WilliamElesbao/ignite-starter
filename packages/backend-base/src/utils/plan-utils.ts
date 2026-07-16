import type { SubscriptionDetailsResponse } from "../plugins/stripe/dtos/subscription/subscription-details-response.dto";

interface SubscriptionSnapshot {
  status: string;
  periodEnd: Date | null;
  cancelAt: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
}

export function resolvePlan(
  subscription: SubscriptionSnapshot | null,
  isWhitelisted: boolean,
): SubscriptionDetailsResponse {
  if (isWhitelisted) {
    return {
      tier: "pro",
      status: "whitelisted",
      periodEnd: undefined,
      isProAccess: true,
      stripeSubscriptionId: undefined,
    };
  }

  if (subscription?.status !== "active") {
    return {
      tier: "free",
      status: "free",
      periodEnd: undefined,
      isProAccess: false,
      stripeSubscriptionId: undefined,
    };
  }

  if (subscription.cancelAt || subscription.cancelAtPeriodEnd) {
    return {
      tier: "pro",
      status: "canceling",
      periodEnd: subscription.periodEnd?.toISOString(),
      isProAccess: true,
      stripeSubscriptionId: subscription.stripeSubscriptionId ?? undefined,
    };
  }

  return {
    tier: "pro",
    status: "active",
    periodEnd: subscription.periodEnd?.toISOString(),
    isProAccess: true,
    stripeSubscriptionId: subscription.stripeSubscriptionId ?? undefined,
  };
}
