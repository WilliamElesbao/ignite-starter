import cron, { Patterns } from "@elysiajs/cron";

// TODO: Cron job to check for subscriptions that have passed their current_period_end and set stripeSubscriptionId to null
const subscriptionExpirationCron = cron({
  name: "subscription-expiration",
  pattern: Patterns.EVERY_10_SECONDS,
  run() {
    console.log("Checking subscription expiration...");
  },
});

export default subscriptionExpirationCron;
