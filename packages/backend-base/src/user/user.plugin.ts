import { Elysia } from "elysia";
import shared from "../shared/shared.plugin";
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
  .group("/user", (app) => {
    return (
      app
        // GET /user → list all users
        .get("/:id", ({ params: { id }, store: { userService } }) => {
          return userService.getUserById({ id });
        })
    );
  });

export type UserPlugin = typeof plugin;
export default plugin;
