import { OpenAPI } from "./src/config/openapi";
import type { SessionResponse } from "./src/lib/better-auth/auth";
import authPlugin, { type AuthPlugin } from "./src/plugins/auth/auth.plugin";
import emailPlugin, {
  type EmailPlugin,
} from "./src/plugins/email/email.plugin";
import stripePlugin, {
  type StripePlugin,
} from "./src/plugins/stripe/stripe.plugin";
import userPlugin, { type UserPlugin } from "./src/plugins/user/user.plugin";

export {
  OpenAPI,
  authPlugin,
  type AuthPlugin,
  emailPlugin,
  type EmailPlugin,
  userPlugin,
  type UserPlugin,
  type SessionResponse,
  stripePlugin,
  type StripePlugin,
};
