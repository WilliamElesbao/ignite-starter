const PLAN_LIMITS = {
  free: {
    maxQrCodes: 3,
    maxFileSizeBytes: 2 * 1024 * 1024, // 2MB
  },
  pro: {
    maxQrCodes: 10,
    maxFileSizeBytes: 5 * 1024 * 1024, // 5MB
  },
} as const;

type PlanTier = keyof typeof PLAN_LIMITS;

type PlanStatus = "free" | "active" | "canceling" | "whitelisted";

interface SubscriptionSnapshot {
  status: string;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
}

interface ResolvedPlan {
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
