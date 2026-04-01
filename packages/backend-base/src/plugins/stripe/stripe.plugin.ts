import { Elysia, t } from "elysia";
import { AppError } from "../../shared/errors/app-error";
import { toErrorResponse } from "../../shared/errors/to-error-response";
import shared from "../../shared/shared.plugin";
import { AUTH_ERROR_MAP, AuthErrorCode } from "../auth/auth.errors";
import authPlugin from "../auth/auth.plugin";
import {
  stripeCreateSubscription404ErrorDto,
  stripeCreateSubscription502ErrorDto,
  stripeDetails502ErrorDto,
  stripeInternalErrorDto,
  stripeProductsErrorDto,
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
  }))
  .group("/stripe", (app) =>
    app
      .get(
        "/products",
        async ({ store: { stripeService, attributes } }) => {
          attributes["plugin.name"] = "stripe";

          const products = await stripeService.getProducts();
          return products;
        },
        {
          detail: { description: "Get all products from Stripe" },
          response: {
            200: ProductsResponseDto,
            500: stripeInternalErrorDto,
            502: stripeProductsErrorDto,
          },
        },
      )
      .post(
        "/subscription",
        async ({ store: { stripeService, attributes }, body, user }) => {
          attributes["plugin.name"] = "stripe";
          attributes["app.plan.name"] = body.planName;
          attributes["app.plan.price_id"] = body.priceId;

          if (!user) {
            attributes["auth.authenticated"] = false;

            throw AppError.fromCatalog({
              code: AuthErrorCode.AUTH_UNAUTHORIZED,
              catalog: AUTH_ERROR_MAP,
            });
          }

          attributes["auth.authenticated"] = true;
          attributes["user.id"] = user.id;
          attributes["has.subscription"] = Boolean(user.stripeSubscriptionId);

          const { url } = await stripeService.createSubscription({
            ...body,
            user,
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
      .get(
        "/subscription/details",
        async ({ store: { stripeService, attributes }, user }) => {
          attributes["plugin.name"] = "stripe";

          if (!user) {
            attributes["auth.authenticated"] = false;

            throw AppError.fromCatalog({
              code: AuthErrorCode.AUTH_UNAUTHORIZED,
              catalog: AUTH_ERROR_MAP,
            });
          }

          attributes["auth.authenticated"] = true;
          attributes["user.id"] = user.id;
          attributes["has.subscription"] = Boolean(user.stripeSubscriptionId);

          const res = await stripeService.subscriptionDetails({ user });
          return res;
        },
        {
          auth: true,
          detail: { description: "Get subscription details" },
          response: {
            200: SubscriptionDetailsResponseDto,
            401: stripeUnauthorizedErrorDto,
            500: stripeInternalErrorDto,
            502: stripeDetails502ErrorDto,
          },
        },
      )
      .patch(
        "/subscription",
        async ({ store: { stripeService, attributes }, body, set, user }) => {
          attributes["plugin.name"] = "stripe";
          attributes["app.plan.name"] = body.planName;
          attributes["app.plan.price_id"] = body.priceId;

          if (!user) {
            attributes["auth.authenticated"] = false;

            throw AppError.fromCatalog({
              code: AuthErrorCode.AUTH_UNAUTHORIZED,
              catalog: AUTH_ERROR_MAP,
            });
          }

          attributes["auth.authenticated"] = true;
          attributes["user.id"] = user.id;
          attributes["has.subscription"] = Boolean(user.stripeSubscriptionId);

          await stripeService.updateSubscription({
            ...body,
            user,
          });

          set.status = 204;
          return;
        },
        {
          auth: true,
          detail: { description: "Update an existing subscription" },
          body: SubscriptionBodyDto,
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
        "/subscription/revoke",
        async ({ store: { stripeService, attributes }, set, user }) => {
          attributes["plugin.name"] = "stripe";

          if (!user) {
            attributes["auth.authenticated"] = false;

            throw AppError.fromCatalog({
              code: AuthErrorCode.AUTH_UNAUTHORIZED,
              catalog: AUTH_ERROR_MAP,
            });
          }

          attributes["auth.authenticated"] = true;
          attributes["user.id"] = user.id;
          attributes["has.subscription"] = Boolean(user.stripeSubscriptionId);

          await stripeService.revokeSubscription({ user });

          set.status = 204;
          return;
        },
        {
          auth: true,
          detail: { description: "Revoke subscription access immediately" },
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
        async ({ request, store: { stripeService, attributes } }) => {
          attributes["plugin.name"] = "stripe";

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
