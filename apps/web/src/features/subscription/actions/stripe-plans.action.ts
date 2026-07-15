"use server";

import { cacheLife, cacheTag } from "next/cache";
import type Stripe from "stripe";
import { cacheKeys } from "@/constants/cache/cache-key";

type Plans = {
  id: string;
  planName: string;
  price: string;
  recurring: Stripe.Price.Recurring.Interval | null;
}[];

export async function stripePlansAction() {
  "use cache";
  cacheTag(cacheKeys.stripePlans());
  cacheLife("hours");

  const res = await fetch(`${process.env.API_URL}/stripe/products`, {
    method: "GET",
  });

  const data = await res.json();

  return { plans: data as Plans };
}
