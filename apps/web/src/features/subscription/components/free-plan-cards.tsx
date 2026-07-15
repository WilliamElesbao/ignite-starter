"use client";

import type { GetStripeSubscriptionResponse } from "@repo/api/generated/api/types.gen";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type Stripe from "stripe";
import { upgradeSubscriptionAction } from "../actions/manage-subscription.action";
import { FREE_FEATURES, PRO_FEATURES } from "../constants/constants";
import { FeatureList } from "./feature-list";
import { UpgradeToProButton } from "./upgrade-to-pro-button";

export interface PlanSectionProps {
  resolvedPlan?: GetStripeSubscriptionResponse;
  proPlanPriceId: string;
  proPlanPrice: string;
  proPlanInterval: Stripe.Price.Recurring.Interval;
}

export function FreePlanCards({
  proPlanPriceId,
  proPlanPrice,
  proPlanInterval,
}: Readonly<Omit<PlanSectionProps, "resolvedPlan">>) {
  const t = useTranslations();

  const { mutateAsync } = useMutation({
    mutationFn: async () => {
      await upgradeSubscriptionAction({
        priceId: proPlanPriceId,
        planName: "pro",
      });
    },
    onError: (error) => {
      console.error("Error upgrading subscription:", error);
    },
    onSuccess: () => {
      console.log("Subscription upgraded successfully!");
    },
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("subscription.free")}</CardTitle>
          <p>
            <span className="text-2xl font-bold">$0</span>
            <span className="text-sm text-muted-foreground">
              {" "}
              / {t("subscription.month")}
            </span>
          </p>
        </CardHeader>
        <CardContent className="flex-1">
          <FeatureList features={FREE_FEATURES} muted />
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" disabled>
            {t("subscription.current-plan")}
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col border-primary/40 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t("subscription.pro")}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {t("subscription.recommended")}
            </Badge>
          </div>
          <p>
            <span className="text-2xl font-bold">{proPlanPrice}</span>
            <span className="text-sm text-muted-foreground">
              {" "}
              / {t(`subscription.${proPlanInterval}`)}
            </span>
          </p>
        </CardHeader>
        <CardContent className="flex-1">
          <FeatureList features={PRO_FEATURES} />
        </CardContent>
        <CardFooter>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutateAsync();
            }}
            className="w-full"
          >
            <UpgradeToProButton />
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
