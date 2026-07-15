import type { GetStripeSubscriptionResponse } from "@repo/api/generated/api/types.gen";
import type messages from "@/lib/i18n/locales/en.json";

type PlanLabel = Extract<
  keyof typeof messages.subscription,
  "free-plan" | "pro-plan"
>;

export const planStatusToLabelMap: Record<
  GetStripeSubscriptionResponse["status"],
  PlanLabel
> = {
  free: "free-plan",
  active: "pro-plan",
  canceling: "pro-plan",
  whitelisted: "pro-plan",
};
