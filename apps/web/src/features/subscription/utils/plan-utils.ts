import type { PlanTier } from "../constants/constants";

export type PlanStatus = "free" | "active" | "canceling" | "whitelisted";

export interface SubscriptionSnapshot {
  status: string;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
}

export interface ResolvedPlan {
  tier: PlanTier;
  status: PlanStatus;
  periodEnd: Date | null;
  isProAccess: boolean;
  stripeSubscriptionId: string | null;
}

export function resolvePlan(
  subscription: SubscriptionSnapshot | null,
  isWhitelisted: boolean,
): ResolvedPlan {
  if (isWhitelisted) {
    return {
      tier: "pro",
      status: "whitelisted",
      periodEnd: null,
      isProAccess: true,
      stripeSubscriptionId: null,
    };
  }

  if (subscription?.status !== "active") {
    return {
      tier: "free",
      status: "free",
      periodEnd: null,
      isProAccess: false,
      stripeSubscriptionId: null,
    };
  }

  if (subscription.cancelAtPeriodEnd) {
    return {
      tier: "pro",
      status: "canceling",
      periodEnd: subscription.periodEnd,
      isProAccess: true,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    };
  }

  return {
    tier: "pro",
    status: "active",
    periodEnd: subscription.periodEnd,
    isProAccess: true,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
  };
}
