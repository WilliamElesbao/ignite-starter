import { ZapIcon } from "lucide-react";

import { Badge as BadgeOriginUI } from "./ui/badge";

type BadgeProps = {
  text: string;
};
export function Badge({ text }: BadgeProps) {
  return (
    <BadgeOriginUI className="absolute top-0 right-0 bg-accent-foreground text-accent">
      <ZapIcon className="-ms-0.5 opacity-60" size={12} aria-hidden="true" />
      {text}
    </BadgeOriginUI>
  );
}
