import { OpenAPI } from "./src/config/openapi";
import subscriptionExpirationCron from "./src/cron/subscription-expiration.cron";
import type { SessionResponse } from "./src/lib/better-auth/auth";
import authPlugin, { type AuthPlugin } from "./src/plugins/auth/auth.plugin";
import emailPlugin, {
  type EmailPlugin,
} from "./src/plugins/email/email.plugin";
import {
  type BullBoardPlugin,
  bullBoardPlugin,
  EmailQueueWorker,
} from "./src/plugins/queue";
import stripePlugin, {
  type StripePlugin,
} from "./src/plugins/stripe/stripe.plugin";

export {
  OpenAPI,
  subscriptionExpirationCron,
  authPlugin,
  type AuthPlugin,
  emailPlugin,
  type EmailPlugin,
  type SessionResponse,
  stripePlugin,
  type StripePlugin,
  bullBoardPlugin,
  EmailQueueWorker,
  type BullBoardPlugin,
};
