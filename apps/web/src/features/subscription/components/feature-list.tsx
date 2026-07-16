import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Feature } from "../constants/constants";

export function FeatureList({
  features,
  muted = false,
}: Readonly<{
  features: readonly Feature[];
  muted?: boolean;
}>) {
  const t = useTranslations(muted ? "features.free" : "features.pro");

  return (
    <ul className="space-y-2">
      {features.map((feature) => (
        <li key={feature} className="flex items-center gap-2 text-sm">
          <CheckCircle2
            className={`h-4 w-4 shrink-0 ${muted ? "text-muted-foreground" : "text-primary"}`}
          />
          <span className={muted ? "text-muted-foreground" : undefined}>
            {t(feature)}
          </span>
        </li>
      ))}
    </ul>
  );
}
