import { stripe } from "@better-auth/stripe";
import { db } from "@repo/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import type Stripe from "stripe";
import { WELCOME_COOKIE } from "../../constants/welcome-cookie";
import { env } from "../../env";
import redisClient from "../../shared/redis.client";
import { logger } from "../logger";
import { stripe as stripeClient } from "../stripe";

export const auth = betterAuth({
  basePath: "/auth",
  trustedOrigins: [env.WEB_URL],
  logger: {
    disabled: false,
    disableColors: false,
    level: "warn",
    log: (level, message, ...args) => {
      const metadata = { msg: message, source: "better-auth", args };

      if (level === "error") {
        logger.error(metadata);
        return;
      }

      if (level === "warn") {
        logger.warn(metadata);
        return;
      }

      logger.info(metadata);
    },
  },
  plugins: [
    openAPI(),
    stripe({
      onCustomerCreate: async (data, ctx) => {
        ctx.setCookie(WELCOME_COOKIE.key, WELCOME_COOKIE.value, {
          maxAge: 60,
          path: "/",
        });
        // Resend sandbox mode only allows sending emails to the account owner's email address.
        // Verify a domain and use a matching `from` address to send emails to other recipients.
        // new EmailService(logger).sendWelcomeEmail({ emailTo: data.user.email });
      },
      stripeClient,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: async () => {
          // Fetch directly from Stripe
          const { data } = await stripeClient.products.list({
            active: true,
            expand: ["data.default_price"],
          });

          return data.map((product) => ({
            name: product.name.toLowerCase(), // match your needs
            priceId: (product.default_price as Stripe.Price).id,
          }));
        },
        onSubscriptionComplete: async ({ subscription }) => {
          logger.info(
            "[Subscription Complete] Revalidating user plan cache for userId: " +
              subscription.referenceId,
          );
        },
        onSubscriptionUpdate: async ({ subscription }) => {
          logger.info(`[Subscription Update]:${subscription.referenceId}`);
        },
        onSubscriptionCancel: async ({ subscription }) => {
          logger.info(`[Subscription Cancel]:${subscription.referenceId}`);
        },
      },
    }),
  ],
  secondaryStorage: {
    get: async (key) => await redisClient.get(key),
    set: async (key, value, ttl) => {
      if (ttl) await redisClient.set(key, value, `${ttl}s`);
      else await redisClient.set(key, value, `${60 * 60 * 24}s`); // Default to 24 hours if no TTL is provided
    },
    delete: async (key) => {
      await redisClient.delete(key);
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  advanced: {
    database: {
      generateId: false,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieCache: {
      enabled: false,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      accessType: "offline",
      prompt: "select_account",
    },
  },
});

export type SessionResponse = typeof auth.$Infer.Session;
