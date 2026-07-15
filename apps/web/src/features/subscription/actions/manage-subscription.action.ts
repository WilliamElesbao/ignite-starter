"use server";

import { refresh, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionAction } from "@/action/get-session.action";
import { cacheKeys } from "@/constants/cache/cache-key";
import type { SubscriptionSchema } from "../schema/use-subscription-schema";

export type ManageSubscriptionResult =
  | { success: true }
  | { success: false; error: string };

export async function upgradeSubscriptionAction(
  formValues: SubscriptionSchema,
) {
  const cookieStore = await cookies();
  const res = await fetch(`${process.env.API_URL}/stripe/subscription`, {
    method: "POST",
    body: JSON.stringify({
      priceId: formValues.priceId,
      planName: formValues.planName,
    }),
    headers: { cookie: cookieStore.toString() },
  });

  const data = (await res.json()) as { url: string };
  console.log("[upgradeSubscriptionAction] data", data);

  if (data?.url) redirect(data.url, "push");

  return data;
}

export async function cancelSubscriptionAction(): Promise<ManageSubscriptionResult> {
  const t = await getTranslations("plans");

  const session = await getSessionAction();
  const user = session?.user;
  if (!user?.id) return { success: false, error: t("errors.unauthenticated") };

  const cookieStore = await cookies();
  await fetch(`${process.env.API_URL}/stripe/subscription/cancel`, {
    method: "PATCH",
    headers: { cookie: cookieStore.toString() },
  });

  revalidateTag(cacheKeys.userPlan(user.id), "hours");
  refresh();
  return { success: true };
}

export async function renewSubscriptionAction(): Promise<ManageSubscriptionResult> {
  const t = await getTranslations("plans");

  const session = await getSessionAction();
  const user = session?.user;
  if (!user?.id) return { success: false, error: t("errors.unauthenticated") };

  const cookieStore = await cookies();
  console.log("[renewSubscriptionAction] cookieStore", cookieStore.toString());
  await fetch(`${process.env.API_URL}/stripe/subscription`, {
    method: "PATCH",
    headers: { cookie: cookieStore.toString() },
  });

  revalidateTag(cacheKeys.userPlan(user.id), "hours");
  refresh();
  return { success: true };
}
