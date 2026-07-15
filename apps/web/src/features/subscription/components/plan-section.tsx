"use client";

import { Text } from "@repo/ui/components/text";
import { useTranslations } from "next-intl";
import {
  useGetStripeProducts,
  useGetStripeSubscriptionDetails,
} from "@/hooks/stripe/stripe.queries";
import { ActivePlanCard } from "./active-plan-card";
import { CancelingPlanCard } from "./canceling-plan-card";
import { DeveloperPlanCard } from "./developer-plan-card";
import { FreePlanCards } from "./free-plan-cards";

export function PlanSection() {
  const t = useTranslations();
  const { data: plans } = useGetStripeProducts();
  const { data: subscription } = useGetStripeSubscriptionDetails();

  const proPlan = plans?.find((plan) => plan.planName === "pro");

  function renderPlanView() {
    switch (subscription?.status) {
      case "whitelisted":
        return <DeveloperPlanCard />;
      case "active":
        return <ActivePlanCard plan={subscription} />;
      case "canceling":
        return <CancelingPlanCard plan={subscription} />;
      case "free":
        return (
          <FreePlanCards
            priceId={proPlan?.id ?? ""}
            price={proPlan?.price ?? ""}
            recurring={proPlan?.recurring ?? "month"}
          />
        );
      default:
        return null;
    }
  }

  return (
    <section className="space-y-4 px-4 lg:px-6">
      <Text variant="heading-md">{t("subscription.plan")}</Text>
      {renderPlanView()}
    </section>
  );
}
