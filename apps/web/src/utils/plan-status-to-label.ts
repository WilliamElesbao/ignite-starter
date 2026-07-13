import type { PlanStatus } from "@/features/subscription/utils/plan-utils";
import type messages from "@/lib/i18n/locales/en.json";

type PlanLabel = Extract<
  keyof typeof messages.subscription,
  "free-plan" | "pro-plan"
>;

export const planStatusToLabelMap: Record<PlanStatus, PlanLabel> = {
  free: "free-plan",
  active: "pro-plan",
  canceling: "pro-plan",
  whitelisted: "pro-plan",
};
