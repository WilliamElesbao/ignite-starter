import { schema } from "@repo/db";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { env } from "../../env";
import type { SessionResponse } from "../../lib/better-auth/auth";
import type { db } from "../../shared/shared.plugin";
import { safePromise } from "../../utils/safe-promise";
import type { TSubscriptionBodyDto } from "./dtos/subscription/subscription-body.dto";

export class StripeService {
  constructor(
    private readonly db: db,
    private readonly stripe: Stripe,
  ) {}

  async getProducts() {
    const prices = await this.stripe.prices.list({
      limit: 3,
    });

    const products = await this.stripe.products.list();

    const normalizedProducts = prices.data.map((price) => {
      const product = products.data.find((p) => p.id === price.product);
      return {
        id: price.id,
        planName: product?.name ?? "Unknown Plan",
        currency: price.currency,
        price: price.unit_amount,
        recurring: price.recurring,
      };
    });

    return normalizedProducts;
  }

  async createSubscription({
    priceId,
    planName,
    user,
  }: TSubscriptionBodyDto & { user: SessionResponse["user"] }) {
    const createSubscription = await this.stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: "http://localhost:3000",
      cancel_url: "http://localhost:3000",
      customer_email: user.email,

      metadata: {
        userId: user.id,
        planName: planName,
      },
    });

    return { url: createSubscription.url };
  }

  async updateSubscription({
    priceId,
    planName,
    user,
  }: TSubscriptionBodyDto & { user: SessionResponse["user"] }) {
    const [subscription] = await this.db
      .select({ stripeSubscriptionId: schema.users.stripeSubscriptionId })
      .from(schema.users)
      .where(eq(schema.users.id, user.id));

    if (!subscription?.stripeSubscriptionId) {
      return { error: "Subscription not found" };
    }

    const [currentSubscription, currentSubscriptionError] = await safePromise(
      this.stripe.subscriptions.retrieve(subscription.stripeSubscriptionId),
    );

    if (currentSubscriptionError) {
      return { error: "Failed to retrieve subscription" };
    }

    const updated = await this.stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [
          {
            id: currentSubscription.items.data[0].id,
            price: priceId,
          },
        ],
        proration_behavior: "create_prorations",

        metadata: {
          userId: user.id,
          planName: planName,
        },
      },
    );

    await this.db
      .update(schema.users)
      .set({
        stripeSubscriptionId: updated.id,
        updatedAt: dayjs().toDate(),
      })
      .where(eq(schema.users.id, user.id))
      .returning();
  }

  async subscriptionDetails({ user }: { user: SessionResponse["user"] }) {
    const [subscription] = await this.db
      .select({ stripeSubscriptionId: schema.users.stripeSubscriptionId })
      .from(schema.users)
      .where(eq(schema.users.id, user.id));

    if (!subscription?.stripeSubscriptionId) {
      return {
        message: "User has no active subscription",
        normalizedSubscriptionDetails: null,
      };
    }

    const subscriptionDetails = await this.stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
    );

    const priceId = subscriptionDetails.items.data[0]?.price?.id;
    const productId = subscriptionDetails.items.data[0]?.price
      ?.product as string;

    const price = await this.stripe.prices.retrieve(priceId);
    const product = await this.stripe.products.retrieve(productId);

    const current_period_start = dayjs
      .unix(subscriptionDetails.items.data[0].current_period_start)
      .toISOString();
    const current_period_end = dayjs
      .unix(subscriptionDetails.items.data[0].current_period_end)
      .toISOString();
    const created = dayjs.unix(subscriptionDetails.created).toISOString();

    const normalizedSubscriptionDetails = {
      id: subscriptionDetails.id,
      status: subscriptionDetails.status,
      current_period_start,
      current_period_end,
      cancel_at_period_end: subscriptionDetails.cancel_at_period_end,
      customer: subscriptionDetails.customer,
      created,
      plan: {
        priceId: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
      },
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
      },
    };

    return normalizedSubscriptionDetails;
  }

  async revokeSubscription({ user }: { user: SessionResponse["user"] }) {
    const [subscription] = await this.db
      .select({ stripeSubscriptionId: schema.users.stripeSubscriptionId })
      .from(schema.users)
      .where(eq(schema.users.id, user.id));

    if (!subscription?.stripeSubscriptionId) {
      return { error: "Subscription not found" };
    }

    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.db
      .update(schema.users)
      .set({ updatedAt: dayjs().toDate() })
      .where(eq(schema.users.id, user.id))
      .returning();
  }

  async webhookHandler({
    payload,
    signature,
  }: {
    payload: string;
    signature: string;
  }) {
    let event: Stripe.Event;

    try {
      event = await this.stripe.webhooks.constructEventAsync(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      console.error("[/stripe/webhook] Invalid signature:", error);
      return {
        status: 400,
        message: `Webhook Error: ${(error as Error).message}`,
      };
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const stripeSubscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : undefined;
        const userId = session.metadata?.userId;

        if (!stripeSubscriptionId || !userId) {
          return {
            status: 400,
            message: "Missing subscription or user metadata",
          };
        }

        try {
          await this.db
            .update(schema.users)
            .set({
              stripeSubscriptionId,
              updatedAt: dayjs().toDate(),
            })
            .where(eq(schema.users.id, userId));
        } catch (error) {
          console.error("[/stripe/webhook] Failed to update user:", error);
          return {
            status: 500,
            message: "Failed to process webhook",
          };
        }

        return {
          status: 200,
          message: "Webhook processed",
        };
      }

      default: {
        console.warn("[/stripe/webhook] Unhandled event type:", event.type);
        return {
          status: 200,
          message: "Webhook processed",
        };
      }
    }
  }
}
