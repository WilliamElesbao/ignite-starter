"use client";

import type { GetStripeSubscriptionResponse } from "@repo/api/generated/api/types.gen";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Loader2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useCancelSubscription } from "../hooks/use-cancel-subscription";

export function ActivePlanCard({
  plan,
}: Readonly<{ plan: GetStripeSubscriptionResponse }>) {
  const t = useTranslations();
  const { mutateAsync, isPending } = useCancelSubscription();

  const format = useFormatter();
  const formattedDate = plan.periodEnd
    ? format.dateTime(new Date(plan.periodEnd), {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {t("subscription.pro-plan")}
              </span>
              <Badge>{t("subscription.active")}</Badge>
            </div>
            {formattedDate && (
              <p className="text-sm text-muted-foreground">
                {t("subscription.renews-on", {
                  date: formattedDate,
                })}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutateAsync()}
            disabled={isPending}
            className="shrink-0"
          >
            {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            {t("subscription.cancel-subscription")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
