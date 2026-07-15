import { Badge } from "@repo/ui/components/ui/badge";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

export function DeveloperPlanCard() {
  const t = useTranslations();

  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{t("subscription.developer-access")}</p>
          <p className="text-sm text-muted-foreground">
            {t("subscription.you-have-full-pro-access-as-a-developer")}
          </p>
        </div>
        <Badge className="shrink-0">{t("subscription.pro")}</Badge>
      </CardContent>
    </Card>
  );
}
