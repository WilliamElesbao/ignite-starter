import { schema } from "@repo/db";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { env } from "../../env";
import type { SessionResponse } from "../../lib/better-auth/auth";
import {
  EVENT_TYPE,
  type EventService,
  type EventType,
} from "../../services/event.service";
import { AppError } from "../../shared/errors/app-error";
import type { db } from "../../shared/shared.plugin";
import type { LoggerErrorDependency } from "../../shared/types/logger-dependency";
import { safePromise } from "../../utils/safe-promise";
import type { TSubscriptionBodyDto } from "./dtos/subscription/subscription-body.dto";
import { STRIPE_ERROR_MAP, StripeErrorCode } from "./stripe.errors";

export class StripeService {
  constructor(
    private readonly db: db,
    private readonly stripe: Stripe,
    private readonly logger: LoggerErrorDependency,
    private readonly eventService: EventService,
  ) {}

  private async trackBusinessEvent({
    type,
    userId,
    payload,
  }: {
    type: EventType;
    userId?: string;
    payload?: unknown;
  }) {
    await this.eventService.createEvent({ type, userId, payload });
  }

  async getProducts() {
    const [prices, pricesError] = await safePromise(
      this.stripe.prices.list({
        limit: 3,
      }),
    );

    if (pricesError) {
      this.logger.error({
        msg: "Failed to list Stripe prices",
        error: pricesError,
      });

      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_PRICES_LIST_FAILED,
        catalog: STRIPE_ERROR_MAP,
        details: pricesError,
      });
    }

    const [products, productsError] = await safePromise(
      this.stripe.products.list(),
    );

    if (productsError) {
      this.logger.error({
        msg: "Failed to list Stripe products",
        error: productsError,
      });

      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_PRODUCTS_LIST_FAILED,
        catalog: STRIPE_ERROR_MAP,
        details: productsError,
      });
    }

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
    const [createSubscription, createSubscriptionError] = await safePromise(
      this.stripe.checkout.sessions.create({
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: env.WEB_URL,
        cancel_url: env.WEB_URL,
        customer_email: user.email,

        metadata: {
          userId: user.id,
          planName: planName,
        },
      }),
    );

    if (createSubscriptionError) {
      this.logger.error({
        msg: "Failed to create Stripe checkout session",
        userId: user.id,
        planName,
        priceId,
        error: createSubscriptionError,
      });

      await this.trackBusinessEvent({
        type: EVENT_TYPE.STRIPE_PAYMENT_FAILED,
        userId: user.id,
        payload: {
          planName,
          priceId,
          reason: "CHECKOUT_CREATE_FAILED",
        },
      });

      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_CHECKOUT_CREATE_FAILED,
        catalog: STRIPE_ERROR_MAP,
        details: createSubscriptionError,
      });
    }

    if (!createSubscription.url) {
      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_CHECKOUT_URL_MISSING,
        catalog: STRIPE_ERROR_MAP,
      });
    }

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
      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_SUBSCRIPTION_NOT_FOUND,
        catalog: STRIPE_ERROR_MAP,
      });
    }

    const [currentSubscription, currentSubscriptionError] = await safePromise(
      this.stripe.subscriptions.retrieve(subscription.stripeSubscriptionId),
    );

    if (currentSubscriptionError) {
      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_SUBSCRIPTION_RETRIEVE_FAILED,
        catalog: STRIPE_ERROR_MAP,
        details: currentSubscriptionError,
      });
    }

    const [updated, updateError] = await safePromise(
      this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
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
      }),
    );

    if (updateError) {
      this.logger.error({
        msg: "Failed to update Stripe subscription",
        userId: user.id,
        subscriptionId: subscription.stripeSubscriptionId,
        planName,
        priceId,
        error: updateError,
      });

      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_SUBSCRIPTION_UPDATE_FAILED,
        catalog: STRIPE_ERROR_MAP,
        details: updateError,
      });
    }

    const [_, updateUserError] = await safePromise(
      this.db
        .update(schema.users)
        .set({
          stripeSubscriptionId: updated.id,
          updatedAt: dayjs().toDate(),
        })
        .where(eq(schema.users.id, user.id))
        .returning(),
    );

    if (updateUserError) {
      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_USER_SUBSCRIPTION_PERSISTENCE_FAILED,
        catalog: STRIPE_ERROR_MAP,
        message: "Failed to persist subscription update",
        details: updateUserError,
      });
    }
  }

  async subscriptionDetails({ user }: { user: SessionResponse["user"] }) {
    const [subscription] = await this.db
      .select({ stripeSubscriptionId: schema.users.stripeSubscriptionId })
      .from(schema.users)
      .where(eq(schema.users.id, user.id));

    if (!subscription?.stripeSubscriptionId) {
      return {
        hasActiveSubscription: false,
        code: StripeErrorCode.STRIPE_SUBSCRIPTION_NOT_FOUND,
        message: "User has no active subscription",
      };
    }

    const [subscriptionDetails, subscriptionDetailsError] = await safePromise(
      this.stripe.subscriptions.retrieve(subscription.stripeSubscriptionId),
    );

    if (subscriptionDetailsError) {
      this.logger.error({
        msg: "Failed to retrieve Stripe subscription details",
        userId: user.id,
        subscriptionId: subscription.stripeSubscriptionId,
        error: subscriptionDetailsError,
      });

      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_SUBSCRIPTION_DETAILS_FAILED,
        catalog: STRIPE_ERROR_MAP,
        details: subscriptionDetailsError,
      });
    }

    const priceId = subscriptionDetails.items.data[0]?.price?.id;
    const productId = subscriptionDetails.items.data[0]?.price
      ?.product as string;

    if (!priceId || !productId) {
      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_SUBSCRIPTION_DATA_INVALID,
        catalog: STRIPE_ERROR_MAP,
      });
    }

    const [price, priceError] = await safePromise(
      this.stripe.prices.retrieve(priceId),
    );
    if (priceError) {
      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_PRICE_RETRIEVE_FAILED,
        catalog: STRIPE_ERROR_MAP,
        details: priceError,
      });
    }

    const [product, productError] = await safePromise(
      this.stripe.products.retrieve(productId),
    );
    if (productError) {
      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_PRODUCT_RETRIEVE_FAILED,
        catalog: STRIPE_ERROR_MAP,
        details: productError,
      });
    }

    const current_period_start = dayjs
      .unix(subscriptionDetails.items.data[0].current_period_start)
      .toISOString();
    const current_period_end = dayjs
      .unix(subscriptionDetails.items.data[0].current_period_end)
      .toISOString();
    const created = dayjs.unix(subscriptionDetails.created).toISOString();

    const normalizedSubscriptionDetails = {
      hasActiveSubscription: true,
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
      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_SUBSCRIPTION_NOT_FOUND,
        catalog: STRIPE_ERROR_MAP,
      });
    }

    const [, revokeError] = await safePromise(
      this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      }),
    );

    if (revokeError) {
      this.logger.error({
        msg: "Failed to revoke Stripe subscription",
        userId: user.id,
        subscriptionId: subscription.stripeSubscriptionId,
        error: revokeError,
      });

      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_SUBSCRIPTION_REVOKE_FAILED,
        catalog: STRIPE_ERROR_MAP,
        details: revokeError,
      });
    }

    const [, updateUserError] = await safePromise(
      this.db
        .update(schema.users)
        .set({ updatedAt: dayjs().toDate() })
        .where(eq(schema.users.id, user.id))
        .returning(),
    );

    if (updateUserError) {
      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_USER_SUBSCRIPTION_PERSISTENCE_FAILED,
        catalog: STRIPE_ERROR_MAP,
        message: "Failed to persist subscription revoke",
        details: updateUserError,
      });
    }

    await this.trackBusinessEvent({
      type: EVENT_TYPE.SUBSCRIPTION_CANCELED,
      userId: user.id,
      payload: {
        subscriptionId: subscription.stripeSubscriptionId,
      },
    });
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
      this.logger.error({
        msg: "Invalid Stripe webhook signature",
        error,
      });

      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_WEBHOOK_INVALID_SIGNATURE,
        catalog: STRIPE_ERROR_MAP,
        message: `Webhook Error: ${(error as Error).message}`,
        details: error,
      });
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
          throw AppError.fromCatalog({
            code: StripeErrorCode.STRIPE_WEBHOOK_METADATA_MISSING,
            catalog: STRIPE_ERROR_MAP,
          });
        }

        const [, updateUserError] = await safePromise(
          this.db
            .update(schema.users)
            .set({
              stripeSubscriptionId,
              updatedAt: dayjs().toDate(),
            })
            .where(eq(schema.users.id, userId)),
        );

        if (updateUserError) {
          throw AppError.fromCatalog({
            code: StripeErrorCode.STRIPE_WEBHOOK_USER_UPDATE_FAILED,
            catalog: STRIPE_ERROR_MAP,
            details: updateUserError,
          });
        }

        return {
          message: "Webhook processed",
        };
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : undefined;

        this.logger.error({
          msg: "Stripe payment failed",
          stripeEventId: event.id,
          customerId,
        });

        await this.trackBusinessEvent({
          type: EVENT_TYPE.STRIPE_PAYMENT_FAILED,
          payload: {
            stripeEventId: event.id,
            customerId,
            amountDue: invoice.amount_due,
            currency: invoice.currency,
          },
        });

        return {
          message: "Webhook processed",
        };
      }

      default: {
        return {
          message: "Webhook processed",
        };
      }
    }
  }
}
