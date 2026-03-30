import cron, { Patterns } from "@elysiajs/cron";
import { db, schema } from "@repo/db";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { stripe } from "../lib/stripe";
import { safePromise } from "../utils/safe-promise";

const isExpiredSubscription = (subscription: Stripe.Subscription) => {
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

  if (subscription.status === "canceled") {
    return true;
  }

  if (subscription.status === "incomplete_expired") {
    return true;
  }

  return Boolean(
    subscription.cancel_at_period_end &&
      currentPeriodEnd &&
      currentPeriodEnd <= dayjs().unix(),
  );
};

const subscriptionExpirationCron = cron({
  name: "subscription-expiration",
  pattern: Patterns.EVERY_HOUR,
  async run() {
    const [users, usersError] = await safePromise(
      db
        .select({
          id: schema.users.id,
          stripeSubscriptionId: schema.users.stripeSubscriptionId,
        })
        .from(schema.users),
    );

    if (usersError) {
      console.error(
        "[subscription-expiration] Failed to fetch users:",
        usersError,
      );
      return;
    }

    const usersWithSubscriptions = users.filter(
      (user) => user.stripeSubscriptionId,
    );

    if (!usersWithSubscriptions.length) {
      return;
    }

    let revokedCount = 0;

    for (const user of usersWithSubscriptions) {
      const stripeSubscriptionId = user.stripeSubscriptionId;

      if (!stripeSubscriptionId) {
        continue;
      }

      const [subscription, subscriptionError] = await safePromise(
        stripe.subscriptions.retrieve(stripeSubscriptionId),
      );

      if (subscriptionError) {
        console.error(
          `[subscription-expiration] Failed to retrieve subscription ${stripeSubscriptionId} for user ${user.id}:`,
          subscriptionError,
        );
        continue;
      }

      if (!isExpiredSubscription(subscription)) {
        continue;
      }

      const [_, updateUserError] = await safePromise(
        db
          .update(schema.users)
          .set({
            stripeSubscriptionId: null,
            updatedAt: dayjs().toDate(),
          })
          .where(eq(schema.users.id, user.id))
          .returning(),
      );

      if (updateUserError) {
        console.error(
          `[subscription-expiration] Failed to clear subscription for user ${user.id}:`,
          updateUserError,
        );
        continue;
      }

      revokedCount += 1;
    }

    if (revokedCount > 0) {
      console.log(
        `[subscription-expiration] Cleared expired subscriptions for ${revokedCount} user(s).`,
      );
    }
  },
});

export default subscriptionExpirationCron;
