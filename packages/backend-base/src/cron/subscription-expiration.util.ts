import { db, schema } from "@repo/db";
import dayjs from "dayjs";
import { eq, isNotNull } from "drizzle-orm";
import type Stripe from "stripe";
import { logger } from "../lib/logger";
import { stripeClient } from "../lib/stripe/stripe-client";

export const CRON_NAME = "subscription-expiration";

const isExpiredSubscription = (subscription: Stripe.Subscription) => {
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

  if (
    subscription.status === "canceled" ||
    subscription.status === "incomplete_expired"
  ) {
    return true;
  }

  return Boolean(
    subscription.cancel_at_period_end &&
      currentPeriodEnd &&
      currentPeriodEnd <= dayjs().unix(),
  );
};

export const fetchUsersWithSubscriptions = async () => {
  return db
    .select({
      id: schema.users.id,
      stripeSubscriptionId: schema.users.stripeCustomerId,
    })
    .from(schema.users)
    .where(isNotNull(schema.users.stripeCustomerId));
};

const clearUserSubscription = async (userId: string) => {
  return db
    .update(schema.users)
    .set({
      stripeCustomerId: null,
      updatedAt: dayjs().toDate(),
    })
    .where(eq(schema.users.id, userId));
};

export const processUser = async (user: {
  id: string;
  stripeSubscriptionId: string | null;
}) => {
  if (!user.stripeSubscriptionId) return false;

  try {
    const subscription = await stripeClient.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );

    if (!isExpiredSubscription(subscription)) {
      return false;
    }

    await clearUserSubscription(user.id);

    return true;
  } catch (error) {
    logger.error({
      msg: "Failed to process user subscription",
      context: CRON_NAME,
      userId: user.id,
      subscriptionId: user.stripeSubscriptionId,
      error,
    });

    return false;
  }
};
