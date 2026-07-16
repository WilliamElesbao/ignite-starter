"use client";

import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { useStripeSubscription } from "@/features/subscription/hooks/stripe.mutations";
import { FREE_FEATURES, PRO_FEATURES } from "../constants/constants";
import { useGetStripeProducts } from "../hooks/stripe.queries";
import { FeatureList } from "./feature-list";

export function FreePlanCards() {
  const t = useTranslations();
  const { data: products } = useGetStripeProducts();
  const { mutateAsync, isPending } = useStripeSubscription();

  const proPlan = products?.find((p) => p.planName === "pro");

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
            <span className="text-2xl font-bold">{proPlan?.price}</span>
            <span className="text-sm text-muted-foreground">
              {" "}
              / {t(`subscription.${proPlan?.recurring ?? "month"}`)}
            </span>
          </p>
        </CardHeader>
        <CardContent className="flex-1">
          <FeatureList features={PRO_FEATURES} />
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            disabled={isPending}
            onClick={() =>
              mutateAsync({
                body: { priceId: proPlan?.id ?? "", planName: "pro" },
              })
            }
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("subscription.upgrade-to-pro")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
