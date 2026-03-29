import openapi from "@elysiajs/openapi";
import {
  emailPlugin,
  OpenAPI,
  stripePlugin,
  subscriptionExpirationCron,
  userPlugin,
} from "@repo/backend-base";
import { Elysia } from "elysia";

const app = new Elysia()
  .use(
    openapi({
      documentation: {
        tags: [
          { name: "Better Auth", description: "Authentication endpoints" },
          { name: "User", description: "Endpoints related to user management" },
          {
            name: "Email",
            description: "Endpoints related to email functionality",
          },
          {
            name: "Stripe",
            description: "Endpoints related to Stripe integration",
          },
        ],
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .use(subscriptionExpirationCron)
  .use(userPlugin)
  .use(emailPlugin)
  .use(stripePlugin);

app.listen(process.env.PORT ?? 3333);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
