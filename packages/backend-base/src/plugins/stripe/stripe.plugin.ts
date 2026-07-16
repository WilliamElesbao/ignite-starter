import { Elysia, t } from "elysia";
import { AppError } from "../../shared/errors/app-error";
import { toErrorResponse } from "../../shared/errors/to-error-response";
import shared from "../../shared/shared.plugin";
import authPlugin from "../auth/auth.plugin";
import {
  stripeCreateSubscription404ErrorDto,
  stripeCreateSubscription502ErrorDto,
  stripeDetails502ErrorDto,
  stripeInternalErrorDto,
  stripeProductsErrorDto,
  stripeProductsNotFoundErrorDto,
  stripeRevoke500ErrorDto,
  stripeRevoke502ErrorDto,
  stripeSubscriptionNotFoundErrorDto,
  stripeUnauthorizedErrorDto,
  stripeUpdateSubscription500ErrorDto,
  stripeUpdateSubscription502ErrorDto,
  stripeWebhook400ErrorDto,
  stripeWebhook500ErrorDto,
} from "./dtos/errors/stripe-error.dto";
import { ProductsResponseDto } from "./dtos/products-response.dto";
import { SubscriptionBodyDto } from "./dtos/subscription/subscription-body.dto";
import { SubscriptionDetailsResponseDto } from "./dtos/subscription/subscription-details-response.dto";
import { SubscriptionResponseDto } from "./dtos/subscription/subscription-response.dto";
import { WebhookResponseDto } from "./dtos/webhook-response.dto";
import { STRIPE_ERROR_MAP, StripeErrorCode } from "./stripe.errors";
import { StripeService } from "./stripe.service";
import { SubscriptionService } from "./subscription.service";

const stripePlugin = new Elysia({ tags: ["Stripe"] })
  .use(shared)
  .use(authPlugin)
  .onError(({ error, set }) => {
    const response = toErrorResponse(error, {
      code: StripeErrorCode.STRIPE_INTERNAL_SERVER_ERROR,
      catalog: STRIPE_ERROR_MAP,
    });

    set.status = response.status;
    return response.body;
  })
  .state((state) => ({
    ...state,
    stripeService: new StripeService(
      state.db,
      state.stripe,
      state.logger,
      state.eventService,
    ),
    subscriptionService: new SubscriptionService(state.db),
  }))
  .group("/stripe", (app) =>
    app
      .get(
        "/products",
        async ({ store: { stripeService } }) => {
          const plans = await stripeService.getProducts();
          return plans;
        },
        {
          detail: { description: "Get all products from Stripe" },
          response: {
            200: ProductsResponseDto,
            404: stripeProductsNotFoundErrorDto,
            500: stripeInternalErrorDto,
            502: stripeProductsErrorDto,
          },
        },
      )
      .get(
        "/subscription",
        async ({ store: { subscriptionService }, user }) => {
          const subscription =
            await subscriptionService.getSubscriptionByUserId(
              user.id,
              user.email,
            );

          return subscription;
        },
        {
          auth: true,
          detail: { description: "Get the current subscription for the user" },
          response: {
            200: SubscriptionDetailsResponseDto,
            401: stripeUnauthorizedErrorDto,
            404: stripeSubscriptionNotFoundErrorDto,
            500: stripeInternalErrorDto,
            502: stripeDetails502ErrorDto,
          },
        },
      )
      .post(
        "/subscription",
        async ({ request, store: { stripeService }, body, user }) => {
          const { url } = await stripeService.upgradeSubscription({
            ...body,
            user,
            headers: request.headers,
          });

          return { url };
        },
        {
          auth: true,
          detail: { description: "Create a new subscription" },
          body: SubscriptionBodyDto,
          response: {
            200: SubscriptionResponseDto,
            401: stripeUnauthorizedErrorDto,
            404: stripeCreateSubscription404ErrorDto,
            500: stripeInternalErrorDto,
            502: stripeCreateSubscription502ErrorDto,
          },
        },
      )
      .patch(
        "/subscription",
        async ({ store: { stripeService }, set, user }) => {
          await stripeService.renewSubscription({
            user,
          });

          set.status = 204;
          return;
        },
        {
          auth: true,
          detail: { description: "Update an existing subscription" },
          response: {
            204: t.Void(),
            401: stripeUnauthorizedErrorDto,
            404: stripeSubscriptionNotFoundErrorDto,
            500: stripeUpdateSubscription500ErrorDto,
            502: stripeUpdateSubscription502ErrorDto,
          },
        },
      )
      .patch(
        "/subscription/cancel",
        async ({ store: { stripeService }, set, user }) => {
          await stripeService.cancelSubscription({ user });

          set.status = 204;
          return;
        },
        {
          auth: true,
          detail: { description: "Cancel an existing subscription" },
          response: {
            204: t.Void(),
            401: stripeUnauthorizedErrorDto,
            404: stripeSubscriptionNotFoundErrorDto,
            500: stripeRevoke500ErrorDto,
            502: stripeRevoke502ErrorDto,
          },
        },
      )
      .post(
        "/webhook",
        async ({ request, store: { stripeService } }) => {
          const signature = request.headers.get("stripe-signature");

          if (!signature) {
            throw AppError.fromCatalog({
              code: StripeErrorCode.STRIPE_SIGNATURE_MISSING,
              catalog: STRIPE_ERROR_MAP,
            });
          }

          const payload = await request.text();
          const response = await stripeService.webhookHandler({
            payload,
            signature,
          });

          return { message: response.message };
        },
        {
          detail: { description: "Stripe webhook" },
          response: {
            200: WebhookResponseDto,
            400: stripeWebhook400ErrorDto,
            500: stripeWebhook500ErrorDto,
          },
        },
      ),
  );

export type StripePlugin = typeof stripePlugin;
export default stripePlugin;
