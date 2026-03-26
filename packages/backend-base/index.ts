import authPLugin, { type AuthPlugin, OpenAPI } from "./src/auth/auth.plugin";
import emailPlugin, { type EmailPlugin } from "./src/email/email.plugin";
import userPlugin, { type UserPlugin } from "./src/user/user.plugin";

export {
  OpenAPI,
  authPLugin,
  type AuthPlugin,
  emailPlugin,
  type EmailPlugin,
  userPlugin,
  type UserPlugin,
};
