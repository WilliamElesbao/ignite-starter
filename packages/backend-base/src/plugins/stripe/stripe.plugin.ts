import { Elysia, t } from "elysia";
import authPLugin from "../../auth/auth.plugin";
import { ErrorDto } from "../../shared/dtos/error.dto";
import shared from "../../shared/shared.plugin";
import { ProductsResponseDto } from "./dtos/products-response.dto";
import { SubscriptionBodyDto } from "./dtos/subscription/subscription-body.dto";
import { SubscriptionDetailsResponseDto } from "./dtos/subscription/subscription-details-response.dto";
import { SubscriptionResponseDto } from "./dtos/subscription/subscription-response.dto";
import { WebhookResponseDto } from "./dtos/webhook-response.dto";
import { StripeService } from "./stripe.service";

export const stripePlugin = new Elysia({ tags: ["Stripe"] })
  .use(shared)
  .use(authPLugin)
  .state((state) => ({
    ...state,
    stripeService: new StripeService(state.db),
  }))
  .group("/stripe", (app) =>
    app
      .get(
        "/products",
        async ({ store: { stripeService } }) => {
          const products = await stripeService.getProducts();
          return products;
        },
        {
          detail: { description: "Get all products from Stripe" },
          response: {
            200: ProductsResponseDto,
          },
        },
      )
      .post(
        "/subscription",
        async ({ store: { stripeService }, body, set, user }) => {
          if (!user) {
            set.status = 401;
            return { message: "Unauthorized" };
          }

          const { url } = await stripeService.createSubscription({
            ...body,
            user,
          });

          if (!url) {
            set.status = 500;
            return { message: "Failed to create subscription" };
          }

          return { url };
        },
        {
          auth: true,
          detail: { description: "Create a new subscription" },
          body: SubscriptionBodyDto,
          response: {
            200: SubscriptionResponseDto,
            401: ErrorDto,
            500: ErrorDto,
          },
        },
      )
      .get(
        "/subscription/details",
        async ({ store: { stripeService }, set, user }) => {
          if (!user) {
            set.status = 401;
            return { message: "Unauthorized" };
          }

          const res = await stripeService.subscriptionDetails({ user });

          return res;
        },
        {
          auth: true,
          detail: { description: "Get subscription details" },
          response: {
            200: SubscriptionDetailsResponseDto,
            401: ErrorDto,
          },
        },
      )
      .patch(
        "/subscription",
        async ({ store: { stripeService }, body, set, user }) => {
          if (!user) {
            set.status = 401;
            return { message: "Unauthorized" };
          }

          const res = await stripeService.updateSubscription({
            ...body,
            user,
          });

          if (res?.error) {
            set.status = 500;
            return { message: res.error };
          }

          set.status = 204;
          return;
        },
        {
          auth: true,
          detail: { description: "Update an existing subscription" },
          body: SubscriptionBodyDto,
          response: {
            204: t.Void(),
            401: ErrorDto,
            500: ErrorDto,
          },
        },
      )
      .patch(
        "/subscription/revoke",
        async ({ store: { stripeService }, set, user }) => {
          if (!user) {
            set.status = 401;
            return { message: "Unauthorized" };
          }
          const res = await stripeService.revokeSubscription({ user });

          if (res?.error) {
            set.status = 500;
          }

          set.status = 204;
          return;
        },
        {
          auth: true,
          detail: { description: "Revoke subscription access immediately" },
          response: {
            204: t.Void(),
            401: ErrorDto,
            500: ErrorDto,
          },
        },
      )
      .post(
        "/webhook",
        async ({ request, set, store: { stripeService } }) => {
          const signature = request.headers.get("stripe-signature");

          if (!signature) {
            set.status = 400;
            return { message: "Missing Stripe signature" };
          }

          const payload = await request.text();
          const response = await stripeService.webhookHandler({
            payload,
            signature,
          });

          set.status = response.status;
          return { message: response.message };
        },
        {
          detail: { description: "Stripe webhook" },
          response: {
            200: WebhookResponseDto,
            400: ErrorDto,
            500: ErrorDto,
          },
        },
      ),
  );

export type StripePlugin = typeof stripePlugin;
