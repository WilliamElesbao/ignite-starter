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
    const [subscription] = await this.db
      .select({
        status: schema.subscriptions.status,
        periodEnd: schema.subscriptions.periodEnd,
        cancelAtPeriodEnd: schema.subscriptions.cancelAtPeriodEnd,
        stripeSubscriptionId: schema.subscriptions.stripeSubscriptionId,
      })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.referenceId, userId))
      .limit(1);

    return resolvePlan(
      subscription
        ? {
            status: subscription.status ?? "inactive",
            periodEnd: subscription.periodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
          }
        : null,
      whitelistedEmails.includes(userEmail),
    );
  }
}
