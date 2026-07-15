"use server";

import { headers } from "next/headers";
import { getSession } from "@/lib/better-auth/auth-server";
import type { ResolvedPlan } from "../utils/plan-utils";

export interface SettingsData {
  user: {
    name: string;
    email: string;
    image: string | null;
  };
  resolvedPlan: ResolvedPlan;
}

export async function getSettingsData(): Promise<SettingsData | null> {
  const session = await getSession();
  const user = session?.user;
  if (!user?.id) return null;

  const subscription = await fetch(
    `${process.env.API_URL}/stripe/subscription`,
    {
      method: "GET",
      headers: await headers(),
    },
  );

  const resolvedPlan = (await subscription.json()) as ResolvedPlan;

  return {
    user: {
      name: user.name,
      email: user.email,
      image: user.image ?? null,
    },
    resolvedPlan,
  };
}
