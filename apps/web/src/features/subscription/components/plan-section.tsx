"use client";

import type { GetStripeSubscriptionResponse } from "@repo/api/generated/api/types.gen";
import { Text } from "@repo/ui/components/text";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import { useGetStripeSubscriptionDetails } from "@/features/subscription/hooks/stripe.queries";
import { ActivePlanCard } from "./active-plan-card";
import { CancelingPlanCard } from "./canceling-plan-card";
import { DeveloperPlanCard } from "./developer-plan-card";
import { FreePlanCards } from "./free-plan-cards";
import { PlanSectionSkeleton } from "./plan-section-skeleton";

const PLAN_VIEW_REGISTRY: Record<
  GetStripeSubscriptionResponse["status"],
  ComponentType
> = {
  whitelisted: DeveloperPlanCard,
  active: ActivePlanCard,
  canceling: CancelingPlanCard,
  free: FreePlanCards,
};

export function PlanSection() {
  const t = useTranslations();

  const { data: subscription, isPending } = useGetStripeSubscriptionDetails();

  const Plan = PLAN_VIEW_REGISTRY[subscription?.status ?? "free"];

  return (
    <section className="space-y-4 px-4 lg:px-6">
      <Text variant="heading-md">{t("subscription.plan")}</Text>
      {isPending ? <PlanSectionSkeleton /> : <Plan />}
    </section>
  );
}
