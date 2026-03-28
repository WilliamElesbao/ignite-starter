import Elysia from "elysia";
import { auth } from "../../lib/better-auth/auth";

const plugin = new Elysia({ name: "better-auth", tags: ["auth"] })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });

        if (!session) {
          return status(401, { message: "Unauthorized" });
        }

        return session;
      },
    },
  });

export type AuthPlugin = typeof plugin;
export default plugin;
