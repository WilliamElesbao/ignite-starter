"use client";

import { Button } from "@repo/ui/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useStripeRenewSubscription } from "@/features/subscription/hooks/stripe.mutations";
import { useGetStripeSubscriptionDetails } from "../hooks/stripe.queries";

export function CancelingPlanCard() {
  const t = useTranslations();
  const { data: subscription } = useGetStripeSubscriptionDetails();
  const { mutateAsync, isPending } = useStripeRenewSubscription();

  const format = useFormatter();
  const formattedDate = subscription?.periodEnd
    ? format.dateTime(new Date(subscription.periodEnd), {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : t("subscription.end-of-billing-period");

  return (
    <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="space-y-1">
        <p className="font-medium text-amber-500">
          {t("subscription.subscription-canceling")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t.rich("subscription.your-pro-access-is-active-until", {
            span: (chunks) => (
              <span className="font-medium text-foreground">{chunks}</span>
            ),
            date: formattedDate,
          })}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => mutateAsync({})}
        disabled={isPending}
      >
        {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        {t("subscription.renew-subscription")}
      </Button>
    </div>
  );
}
