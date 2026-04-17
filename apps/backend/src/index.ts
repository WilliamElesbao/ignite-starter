import openapi from "@elysiajs/openapi";
import {
  EmailQueueWorker,
  emailPlugin,
  OpenAPI,
  stripePlugin,
  subscriptionExpirationCron,
  userPlugin,
} from "@repo/backend-base";
import { logger } from "@repo/backend-base/src/lib/logger";
import { Elysia } from "elysia";
import { instrumentation } from "./instrumentation";

const app = new Elysia()
  .use(instrumentation)
  .use(
    openapi({
      provider: "scalar",
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
          {
            name: "Admin",
            description: "Administrative endpoints and monitoring tools",
          },
        ],
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .use(subscriptionExpirationCron)
  .use(userPlugin)
  .use(emailPlugin) // Email plugin includes bullBoardPlugin
  .use(stripePlugin);

// Start email worker (can be disabled in production)
const emailWorker = new EmailQueueWorker(logger);
await emailWorker.start();

app.listen(process.env.PORT ?? 3333);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
console.log(
  `📊 Bull Board UI: http://${app.server?.hostname}:${app.server?.port}/admin/queues`,
);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await emailWorker.stop();
  process.exit(0);
});
