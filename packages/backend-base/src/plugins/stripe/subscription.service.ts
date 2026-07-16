import { schema } from "@repo/db";
import { eq } from "drizzle-orm";
import { env } from "../../env";
import type { db } from "../../shared/shared.plugin";
import { getWhitelistedEmails } from "../../utils/get-whitelisted-emails";
import { resolvePlan } from "../../utils/plan-utils";

const whitelistedEmails = getWhitelistedEmails(env.WHITELISTED_EMAILS);

export class SubscriptionService {
  constructor(private readonly db: db) {}

  async getSubscriptionByUserId(userId: string, userEmail: string) {
    const subscription = await this.db.query.subscriptions.findFirst({
      where: eq(schema.subscriptions.referenceId, userId),
      columns: {
        status: true,
        periodEnd: true,
        cancelAt: true,
        cancelAtPeriodEnd: true,
        stripeSubscriptionId: true,
      },
    });

    return resolvePlan(subscription, whitelistedEmails.includes(userEmail));
  }
}
