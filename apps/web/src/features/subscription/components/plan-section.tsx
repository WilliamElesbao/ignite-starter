import { Text } from "@repo/ui/components/text";
import { getTranslations } from "next-intl/server";
import { getSettingsData } from "../actions/get-settings.action";
import { stripePlansAction } from "../actions/stripe-plans.action";
import { ActivePlanCard } from "./active-plan-card";
import { CancelingPlanCard } from "./canceling-plan-card";
import { DeveloperPlanCard } from "./developer-plan-card";
import { FreePlanCards } from "./free-plan-cards";

export async function PlanSection() {
  const [t, { plans }, data] = await Promise.all([
    getTranslations(),
    stripePlansAction(),
    getSettingsData(),
  ]);

  const proPlan = plans.find((plan) => plan.planName === "pro");

  function renderPlanView() {
    switch (data?.resolvedPlan?.status) {
      case "whitelisted":
        return <DeveloperPlanCard />;
      case "active":
        return <ActivePlanCard plan={data?.resolvedPlan} />;
      case "canceling":
        return <CancelingPlanCard plan={data?.resolvedPlan} />;
      case "free":
        return (
          <FreePlanCards
            proPlanPriceId={proPlan?.id ?? ""}
            proPlanPrice={proPlan?.price ?? ""}
            proPlanInterval={proPlan?.recurring ?? "month"}
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
