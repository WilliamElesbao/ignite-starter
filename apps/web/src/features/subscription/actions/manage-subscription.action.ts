"use server";

import { refresh, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { cacheKeys } from "@/constants/cache/cache-key";
import { getSession } from "@/lib/better-auth/auth-server";
import type { SubscriptionSchema } from "../schema/use-subscription-schema";

export type ManageSubscriptionResult =
  | { success: true }
  | { success: false; error: string };

export async function upgradeSubscriptionAction(
  formValues: SubscriptionSchema,
) {
  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get("cookie");
  const res = await fetch(`${process.env.API_URL}/stripe/subscription`, {
    method: "POST",
    body: JSON.stringify({
      priceId: formValues.priceId,
      planName: formValues.planName,
    }),
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
  });

  const data = (await res.json()) as { url: string };
  console.log("[upgradeSubscriptionAction] data", data);

  if (data?.url) redirect(data.url, "push");

  return data;
}

export async function cancelSubscriptionAction(): Promise<ManageSubscriptionResult> {
  const t = await getTranslations("plans");

  const session = await getSession();
  const user = session?.user;
  if (!user?.id) return { success: false, error: t("errors.unauthenticated") };

  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get("cookie");
  await fetch(`${process.env.API_URL}/stripe/subscription/cancel`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
  });

  revalidateTag(cacheKeys.userPlan(user.id), "hours");
  refresh();
  return { success: true };
}

export async function renewSubscriptionAction(): Promise<ManageSubscriptionResult> {
  const t = await getTranslations("plans");

  const session = await getSession();
  const user = session?.user;
  if (!user?.id) return { success: false, error: t("errors.unauthenticated") };

  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get("cookie");
  await fetch(`${process.env.API_URL}/stripe/subscription`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
  });

  revalidateTag(cacheKeys.userPlan(user.id), "hours");
  refresh();
  return { success: true };
}
