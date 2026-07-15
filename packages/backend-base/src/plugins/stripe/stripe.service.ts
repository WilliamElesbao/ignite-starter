import { schema } from "@repo/db";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { env } from "../../env";
import { auth, type SessionResponse } from "../../lib/better-auth/auth";
import { stripe } from "../../lib/stripe";
import {
  EVENT_TYPE,
  type EventService,
  type EventType,
} from "../../services/event.service";
import { AppError } from "../../shared/errors/app-error";
import type { db } from "../../shared/shared.plugin";
import type { LoggerErrorDependency } from "../../shared/types/logger-dependency";
import { formatPrice } from "../../utils/format-price";
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
    const [products, productsError] = await safePromise(
      this.stripe.products.list({
        active: true,
        expand: ["data.default_price"],
      }),
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

    const normalizedPlans = products.data.map((product) => {
      const price = product.default_price as Stripe.Price;

      return {
        id: price.id,
        planName: product.name.toLowerCase(),
        price: formatPrice({
          currency: price.currency as "usd" | "brl",
          amount: price.unit_amount ?? 0,
        }),
        recurring: price.recurring?.interval ?? null,
      };
    });

    return normalizedPlans;
  }

  async upgradeSubscription({
    priceId,
    planName,
    user,
    headers,
  }: TSubscriptionBodyDto & {
    user: SessionResponse["user"];
    headers: Headers;
  }) {
    const [result, error] = await safePromise(
      auth.api.upgradeSubscription({
        body: {
          plan: planName,
          customerType: "user",
          successUrl: `${env.WEB_URL}/subscription`,
          cancelUrl: `${env.WEB_URL}/subscription`,
          disableRedirect: true,
        },
        headers,
      }),
    );

    if (error) {
      this.logger.error({
        msg: "Failed to upgrade subscription via better-auth",
        userId: user.id,
        planName,
        priceId,
        error,
      });

      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_CHECKOUT_CREATE_FAILED,
        catalog: STRIPE_ERROR_MAP,
        details: error,
      });
    }

    return result;
  }

  async renewSubscription({ user }: { user: SessionResponse["user"] }) {
    if (!user.stripeCustomerId) {
      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_CUSTOMER_NOT_FOUND,
        catalog: STRIPE_ERROR_MAP,
      });
    }

    const [userSubscription, userSubscriptionError] = await safePromise(
      this.db
        .select({
          stripeSubscriptionId: schema.subscriptions.stripeSubscriptionId,
        })
        .from(schema.subscriptions)
        .where(
          eq(schema.subscriptions.stripeCustomerId, user.stripeCustomerId),
        ),
    );

    if (userSubscriptionError) {
      this.logger.error({
        msg: "Failed to retrieve user subscription",
        userId: user.id,
        error: userSubscriptionError,
      });

      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_SUBSCRIPTION_NOT_FOUND,
        catalog: STRIPE_ERROR_MAP,
      });
    }

    const [subscription] = userSubscription;
    if (!subscription?.stripeSubscriptionId) {
      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_SUBSCRIPTION_NOT_FOUND,
        catalog: STRIPE_ERROR_MAP,
      });
    }

    const subscriptionId = subscription.stripeSubscriptionId;
    const [, stripeError] = await safePromise(
      stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      }),
    );
    if (stripeError) {
      this.logger.error({
        msg: "Failed to renew Stripe subscription",
        userId: user.id,
        subscriptionId,
        error: stripeError,
      });

      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_SUBSCRIPTION_UPDATE_FAILED,
        catalog: STRIPE_ERROR_MAP,
        details: stripeError,
      });
    }

    const [renewSubscription, renewSubscriptionError] = await safePromise(
      this.db
        .update(schema.subscriptions)
        .set({ cancelAtPeriodEnd: false })
        .where(eq(schema.subscriptions.referenceId, user.id))
        .returning(),
    );

    if (renewSubscriptionError) {
      this.logger.error({
        msg: "Failed to renew subscription in DB",
        userId: user.id,
        error: renewSubscriptionError,
      });

      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_SUBSCRIPTION_UPDATE_FAILED,
        catalog: STRIPE_ERROR_MAP,
        details: renewSubscriptionError,
      });
    }

    const [renewed] = renewSubscription;
    await this.trackBusinessEvent({
      type: EVENT_TYPE.SUBSCRIPTION_RENEWED,
      userId: user.id,
      payload: {
        renewed,
      },
    });
  }

  async cancelSubscription({ user }: { user: SessionResponse["user"] }) {
    if (!user.stripeCustomerId) {
      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_CUSTOMER_NOT_FOUND,
        catalog: STRIPE_ERROR_MAP,
      });
    }

    const [currentSubscription] = await this.db
      .select({
        stripeSubscriptionId: schema.subscriptions.stripeSubscriptionId,
      })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.stripeCustomerId, user.stripeCustomerId));

    if (!currentSubscription?.stripeSubscriptionId) {
      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_SUBSCRIPTION_NOT_FOUND,
        catalog: STRIPE_ERROR_MAP,
      });
    }

    const subscriptionId = currentSubscription.stripeSubscriptionId;
    const [, stripeError] = await safePromise(
      stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      }),
    );

    if (stripeError) {
      this.logger.error({
        msg: "Failed to revoke Stripe subscription",
        userId: user.id,
        subscriptionId,
        error: stripeError,
      });

      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_SUBSCRIPTION_REVOKE_FAILED,
        catalog: STRIPE_ERROR_MAP,
        details: stripeError,
      });
    }

    const [subscription, subscriptionError] = await safePromise(
      this.db
        .update(schema.subscriptions)
        .set({ cancelAtPeriodEnd: true })
        .where(eq(schema.subscriptions.referenceId, user.id))
        .returning(),
    );

    if (subscriptionError) {
      this.logger.error({
        msg: "Failed to revoke subscription in DB",
        userId: user.id,
        error: subscriptionError,
      });

      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_SUBSCRIPTION_REVOKE_FAILED,
        catalog: STRIPE_ERROR_MAP,
        details: subscriptionError,
      });
    }

    const [revoked] = subscription;

    await this.trackBusinessEvent({
      type: EVENT_TYPE.SUBSCRIPTION_CANCELED,
      userId: user.id,
      payload: {
        revoked,
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
    const [event, eventError] = await safePromise(
      this.stripe.webhooks.constructEventAsync(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      ),
    );

    if (eventError) {
      this.logger.error({
        msg: "Failed to process Stripe webhook",
        error: eventError,
      });

      this.logger.error({
        msg: "Invalid Stripe webhook signature",
        error: eventError,
      });

      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_WEBHOOK_INVALID_SIGNATURE,
        catalog: STRIPE_ERROR_MAP,
        message: `Webhook Error: ${eventError.message}`,
        details: eventError,
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
