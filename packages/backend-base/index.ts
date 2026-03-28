import authPLugin, { type AuthPlugin, OpenAPI } from "./src/auth/auth.plugin";
import type { SessionResponse } from "./src/lib/better-auth/auth";
import {
  type EmailPlugin,
  emailPlugin,
} from "./src/plugins/email/email.plugin";
import {
  type StripePlugin,
  stripePlugin,
} from "./src/plugins/stripe/stripe.plugin";
import { type UserPlugin, userPlugin } from "./src/plugins/user/user.plugin";

export {
  OpenAPI,
  authPLugin,
  type AuthPlugin,
  emailPlugin,
  type EmailPlugin,
  userPlugin,
  type UserPlugin,
  type SessionResponse,
  stripePlugin,
  type StripePlugin,
};
