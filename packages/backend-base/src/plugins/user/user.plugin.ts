import { Elysia } from "elysia";
import { AppError } from "../../shared/errors/app-error";
import { toErrorResponse } from "../../shared/errors/to-error-response";
import shared from "../../shared/shared.plugin";
import { AUTH_ERROR_MAP, AuthErrorCode } from "../auth/auth.errors";
import authPlugin from "../auth/auth.plugin";
import { authUnauthorizedErrorDto } from "../auth/dtos/auth-error.dto";
import { SubscriptionService } from "../auth/subscription.service";
import {
  userInternalErrorDto,
  userNotFoundErrorDto,
} from "./dtos/errors/user-error.dto";
import { UserResponseDto } from "./dtos/user-response.dto";
import { USER_ERROR_MAP, UserErrorCode } from "./user.errors";
import { UserService } from "./user.service";

const userPlugin = new Elysia({ tags: ["User"] })
  .use(shared)
  .use(authPlugin)
  .onError(({ error, set }) => {
    const response = toErrorResponse(error, {
      code: UserErrorCode.USER_FETCH_FAILED,
      catalog: USER_ERROR_MAP,
    });

    set.status = response.status;
    return response.body;
  })
  .state((state) => ({
    ...state,
    userService: new UserService(state.db, state.logger),
    subscriptionService: new SubscriptionService(state.db),
  }))
  .group("/user", (app) =>
    app
      .get(
        "/subscription",
        async ({ store: { subscriptionService }, user }) => {
          const subscription =
            await subscriptionService.getSubscriptionByUserId(
              user.id,
              user.email,
            );

          return subscription;
        },
        { auth: true },
      )
      .get(
        "/:id",
        async ({ params: { id }, store: { userService }, user }) => {
          if (!user) {
            throw AppError.fromCatalog({
              code: AuthErrorCode.AUTH_UNAUTHORIZED,
              catalog: AUTH_ERROR_MAP,
            });
          }

          const userById = await userService.getUserById({ id });

          if (!userById) {
            throw AppError.fromCatalog({
              code: UserErrorCode.USER_NOT_FOUND,
              catalog: USER_ERROR_MAP,
            });
          }

          return userById;
        },
        {
          auth: true,
          detail: { description: "Get user by ID" },
          response: {
            200: UserResponseDto,
            401: authUnauthorizedErrorDto,
            404: userNotFoundErrorDto,
            500: userInternalErrorDto,
          },
        },
      ),
  );

export type UserPlugin = typeof userPlugin;
export default userPlugin;
