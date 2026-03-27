import authPLugin, { type AuthPlugin, OpenAPI } from "./src/auth/auth.plugin";
import type { SessionResponse } from "./src/lib/better-auth/auth";
import emailPlugin, {
  type EmailPlugin,
} from "./src/plugins/email/email.plugin";
import userPlugin, { type UserPlugin } from "./src/plugins/user/user.plugin";

export {
  OpenAPI,
  authPLugin,
  type AuthPlugin,
  emailPlugin,
  type EmailPlugin,
  userPlugin,
  type UserPlugin,
  type SessionResponse,
};
