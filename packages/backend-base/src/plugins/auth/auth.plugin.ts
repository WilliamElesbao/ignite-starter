import Elysia from "elysia";
import { auth } from "../../lib/better-auth/auth";
import { AppError } from "../../shared/errors/app-error";
import { toErrorResponse } from "../../shared/errors/to-error-response";
import { AUTH_ERROR_MAP, AuthErrorCode } from "./auth.errors";

const plugin = new Elysia({ name: "better-auth", tags: ["auth"] })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ request: { headers }, status }) {
        try {
          const session = await auth.api.getSession({ headers });

          if (!session) {
            const unauthorizedError = AppError.fromCatalog({
              code: AuthErrorCode.AUTH_UNAUTHORIZED,
              catalog: AUTH_ERROR_MAP,
            });

            return status(unauthorizedError.status, {
              code: unauthorizedError.code,
              message: unauthorizedError.message,
            });
          }

          return session;
        } catch (error) {
          const normalizedError = AppError.fromUnknown(error, {
            code: AuthErrorCode.AUTH_SESSION_RESOLVE_FAILED,
            catalog: AUTH_ERROR_MAP,
          });

          const response = toErrorResponse(normalizedError);
          return status(response.status, response.body);
        }
      },
    },
  });

export type AuthPlugin = typeof plugin;
export default plugin;
