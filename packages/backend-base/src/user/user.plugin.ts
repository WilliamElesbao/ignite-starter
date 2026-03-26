import { Elysia } from "elysia";
import { ErrorDto } from "../shared/dtos/error.dto";
import shared from "../shared/shared.plugin";
import { UserResponseDto } from "./dtos/user-response.dto";
import { UserService } from "./user.service";

const plugin = new Elysia({ tags: ["user"] })
  .use(shared)
  .state((state) => ({
    ...state,
    userService: new UserService(state.db),
  }))
  .group("/user", (app) =>
    app.get(
      "/:id",
      async ({ params: { id }, store: { userService }, set }) => {
        const user = await userService.getUserById({ id });

        if (!user) {
          set.status = 404;
          return { message: "User not found" };
        }

        return user;
      },
      {
        detail: { description: "Get user by ID" },
        response: {
          200: UserResponseDto,
          404: ErrorDto,
        },
      },
    ),
  );

export type UserPlugin = typeof plugin;
export default plugin;
