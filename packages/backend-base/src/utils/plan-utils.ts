import type { schema } from "@repo/db";
import type { SubscriptionDetailsResponse } from "../plugins/stripe/dtos/subscription/subscription-details-response.dto";

type SubscriptionSnapshot = Pick<
  typeof schema.subscriptions.$inferSelect,
  | "status"
  | "periodEnd"
  | "cancelAt"
  | "cancelAtPeriodEnd"
  | "stripeSubscriptionId"
>;

const FREE_PLAN: SubscriptionDetailsResponse = {
  tier: "free",
  status: "free",
  periodEnd: undefined,
  isProAccess: false,
  stripeSubscriptionId: undefined,
};

const WHITELISTED_PLAN: SubscriptionDetailsResponse = {
  tier: "pro",
  status: "whitelisted",
  periodEnd: undefined,
  isProAccess: true,
  stripeSubscriptionId: undefined,
};

export function resolvePlan(
  subscription?: SubscriptionSnapshot | null,
  isWhitelisted?: boolean,
): SubscriptionDetailsResponse {
  if (isWhitelisted) {
    return WHITELISTED_PLAN;
  }

  if (subscription?.status !== "active") {
    return FREE_PLAN;
  }

  const proPlan = {
    tier: "pro" as const,
    isProAccess: true,
    periodEnd: subscription.periodEnd?.toISOString(),
    stripeSubscriptionId: subscription.stripeSubscriptionId ?? undefined,
  };

  return {
    ...proPlan,
    status:
      subscription.cancelAt !== null || subscription.cancelAtPeriodEnd
        ? "canceling"
        : "active",
  };
}
