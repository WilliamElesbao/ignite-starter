"use client";

import { Badge } from "@repo/ui/components/ui/badge";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { useGetStripeSubscriptionDetails } from "@/features/subscription/hooks/stripe.queries";
import { planStatusToLabelMap } from "@/utils/plan-status-to-label";

export function UserPlanBadge() {
  const t = useTranslations("subscription");
  const { data: subscription, isPending } = useGetStripeSubscriptionDetails();

  if (isPending) {
    return <UserPlanBadgeSkeleton />;
  }

  if (!subscription) {
    return null;
  }

  const planLabel = planStatusToLabelMap[subscription?.status];

  return <Badge>{t(planLabel)}</Badge>;
}

function UserPlanBadgeSkeleton() {
  return <Skeleton className="h-5 w-20 rounded-md" />;
}
