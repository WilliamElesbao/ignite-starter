import { schema } from "@repo/db";
import { and, eq } from "drizzle-orm";
import type Stripe from "stripe";
import { env } from "../../env";
import { auth, type SessionResponse } from "../../lib/better-auth/auth";
import { stripeClient } from "../../lib/stripe/stripe-client";
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
        recurring: price.recurring?.interval,
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

    return { url: result.url ?? undefined };
  }

  async cancelSubscription({ user }: { user: SessionResponse["user"] }) {
    if (!user.stripeCustomerId) {
      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_CUSTOMER_NOT_FOUND,
        catalog: STRIPE_ERROR_MAP,
      });
    }

    const [userSubscription, userSubscriptionError] = await safePromise(
      this.db.query.subscriptions.findFirst({
        where: and(
          eq(schema.subscriptions.referenceId, user.id),
          eq(schema.subscriptions.status, "active"),
        ),
        columns: { stripeSubscriptionId: true },
      }),
    );
    const subscriptionId = userSubscription?.stripeSubscriptionId;

    if (!subscriptionId || userSubscriptionError) {
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

    const [, stripeError] = await safePromise(
      stripeClient.subscriptions.update(subscriptionId, {
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

    const [cancelSubscription, cancelSubscriptionError] = await safePromise(
      this.db
        .update(schema.subscriptions)
        .set({ cancelAtPeriodEnd: true })
        .where(
          and(
            eq(schema.subscriptions.referenceId, user.id),
            eq(schema.subscriptions.status, "active"),
          ),
        )
        .returning(),
    );

    if (cancelSubscriptionError) {
      this.logger.error({
        msg: "Failed to cancel subscription in DB",
        userId: user.id,
        error: cancelSubscriptionError,
      });

      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_SUBSCRIPTION_REVOKE_FAILED,
        catalog: STRIPE_ERROR_MAP,
        details: cancelSubscriptionError,
      });
    }

    const [canceled] = cancelSubscription;
    await this.trackBusinessEvent({
      type: EVENT_TYPE.SUBSCRIPTION_CANCELED,
      userId: user.id,
      payload: {
        canceled,
      },
    });
  }

  async renewSubscription({ user }: { user: SessionResponse["user"] }) {
    if (!user.stripeCustomerId) {
      throw AppError.fromCatalog({
        code: StripeErrorCode.STRIPE_CUSTOMER_NOT_FOUND,
        catalog: STRIPE_ERROR_MAP,
      });
    }

    const [userSubscription, userSubscriptionError] = await safePromise(
      this.db.query.subscriptions.findFirst({
        where: and(
          eq(schema.subscriptions.referenceId, user.id),
          eq(schema.subscriptions.status, "active"),
        ),
        columns: { stripeSubscriptionId: true },
      }),
    );
    const stripeSubscriptionId = userSubscription?.stripeSubscriptionId;

    if (!stripeSubscriptionId || userSubscriptionError) {
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

    const [, stripeError] = await safePromise(
      stripeClient.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: false,
      }),
    );

    if (stripeError) {
      this.logger.error({
        msg: "Failed to renew Stripe subscription",
        userId: user.id,
        stripeSubscriptionId,
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
}
