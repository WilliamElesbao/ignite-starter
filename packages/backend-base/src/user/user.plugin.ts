import { Elysia } from "elysia";
import { ErrorDto } from "../shared/dtos/error.dto";
import shared from "../shared/shared.plugin";
import { UserResponseDto } from "./dtos/user-response.dto";
import { UserService } from "./user.service";

/* -------------------------------------------------
   1️⃣ Build the base app
   ------------------------------------------------- */
const plugin = new Elysia()
  // bring in shared utilities (db, logger, …)
  .use(shared)

  // put the service in the app state – it will be available as
  // `store.userService` inside every handler
  .state((state) => ({
    ...state,
    userService: new UserService(state.db),
  }))

  /* -------------------------------------------------
     2️⃣ Group all user‑related routes under /user
        (no guard here)
     ------------------------------------------------- */
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
        response: {
          200: UserResponseDto,
          404: ErrorDto,
        },
      },
    ),
  );

export type UserPlugin = typeof plugin;
export default plugin;
