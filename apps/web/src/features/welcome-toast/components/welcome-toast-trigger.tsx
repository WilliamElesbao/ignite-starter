"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { clearWelcomeCookie } from "../actions/clear-welcome-cookie.action";

type Props = {
  show: boolean;
};

export function WelcomeToastTrigger({ show }: Props) {
  const t = useTranslations("welcome-toast");
  const hasShown = useRef(false);

  useEffect(() => {
    if (!show || hasShown.current) return;
    hasShown.current = true;

    toast.success(t("title"), {
      description: t("description"),
      position: "top-center",
    });

    clearWelcomeCookie();
  }, [show, t]);

  return null;
}
