import cron, { Patterns } from "@elysiajs/cron";
import { logger } from "../lib/logger";
import {
  CRON_NAME,
  fetchUsersWithSubscriptions,
  processUser,
} from "./subscription-expiration.util";

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

      logger.info({
        msg: "Subscription expiration job completed",
        context: CRON_NAME,
        totalUsers: users.length,
        revokedCount,
        durationMs: Date.now() - start,
      });
    } catch (error) {
      logger.error({
        msg: "Subscription expiration job failed",
        context: CRON_NAME,
        error,
      });
    }
  },
});

export default subscriptionExpirationCron;
