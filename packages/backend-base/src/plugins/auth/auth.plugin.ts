import Elysia from "elysia";
import { auth } from "../../lib/better-auth/auth";
import { EVENT_TYPE } from "../../services/event.service";
import { AppError } from "../../shared/errors/app-error";
import { toErrorResponse } from "../../shared/errors/to-error-response";
import shared from "../../shared/shared.plugin";
import { AUTH_ERROR_MAP, AuthErrorCode } from "./auth.errors";

const plugin = new Elysia({ name: "better-auth", tags: ["auth"] })
  .use(shared)
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({
        request,
        status,
        store: { logger, eventService, attributes },
      }) {
        attributes["plugin.name"] = "auth";

        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session) {
            const unauthorizedError = AppError.fromCatalog({
              code: AuthErrorCode.AUTH_UNAUTHORIZED,
              catalog: AUTH_ERROR_MAP,
            });

            attributes["auth.authenticated"] = false;

            logger.warn({
              msg: "Unauthorized request in auth macro",
              path: request.url,
              method: request.method,
            });

            return status(unauthorizedError.status, {
              code: unauthorizedError.code,
              message: unauthorizedError.message,
            });
          }

          attributes["auth.authenticated"] = true;
          attributes["user.id"] = session.user.id;
          attributes["has.subscription"] = Boolean(
            session.user.stripeSubscriptionId,
          );

          return session;
        } catch (error) {
          const normalizedError = AppError.fromUnknown(error, {
            code: AuthErrorCode.AUTH_SESSION_RESOLVE_FAILED,
            catalog: AUTH_ERROR_MAP,
          });

          attributes["auth.authenticated"] = false;

          logger.error({
            msg: "Failed to resolve auth session",
            path: request.url,
            method: request.method,
            error,
          });

          await eventService.createEvent({
            type: EVENT_TYPE.LOGIN_SUSPICIOUS,
            payload: {
              path: request.url,
              method: request.method,
              reason: "AUTH_SESSION_RESOLVE_FAILED",
            },
          });

          const response = toErrorResponse(normalizedError);
          return status(response.status, response.body);
        }
      },
    },
  });

export type AuthPlugin = typeof plugin;
export default plugin;
