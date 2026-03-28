import { Elysia } from "elysia";
import { ErrorDto } from "../../shared/dtos/error.dto";
import shared from "../../shared/shared.plugin";
import authPlugin from "../auth/auth.plugin";
import { UserResponseDto } from "./dtos/user-response.dto";
import { UserService } from "./user.service";

const userPlugin = new Elysia({ tags: ["User"] })
  .use(shared)
  .use(authPlugin)
  .state((state) => ({
    ...state,
    userService: new UserService(state.db),
  }))
  .group("/user", (app) =>
    app.get(
      "/:id",
      async ({ params: { id }, store: { userService }, set, user }) => {
        const authenticatedUserName = user;
        console.log({ authenticatedUserName });

        const userById = await userService.getUserById({ id });

        if (!userById) {
          set.status = 404;
          return { message: "User not found" };
        }

        return userById;
      },
      {
        auth: true,
        detail: { description: "Get user by ID" },
        response: {
          200: UserResponseDto,
          404: ErrorDto,
        },
      },
    ),
  );

export type UserPlugin = typeof userPlugin;
export default userPlugin;
