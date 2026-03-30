import cron, { Patterns } from "@elysiajs/cron";
import {
  CRON_NAME,
  fetchUsersWithSubscriptions,
  processUser,
} from "./subscription-expiration.helpers";

const subscriptionExpirationCron = cron({
  name: CRON_NAME,
  pattern: Patterns.EVERY_HOUR,

  async run() {
    const start = Date.now();

    try {
      const users = await fetchUsersWithSubscriptions();

      if (!users.length) return;

      const results = await Promise.allSettled(
        users.map((user) => processUser(user)),
      );

      const revokedCount = results.filter(
        (r) => r.status === "fulfilled" && r.value === true,
      ).length;

      console.info({
        context: CRON_NAME,
        totalUsers: users.length,
        revokedCount,
        durationMs: Date.now() - start,
        message: "Subscription expiration job completed",
      });
    } catch (error) {
      console.error({
        context: CRON_NAME,
        error,
        message: "Subscription expiration job failed",
      });
    }
  },
});

export default subscriptionExpirationCron;
