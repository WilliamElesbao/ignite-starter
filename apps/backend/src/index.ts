import { cors } from "@elysiajs/cors";
import openapi from "@elysiajs/openapi";
import { emailPlugin, OpenAPI, userPlugin } from "@repo/backend-base";
import { Elysia } from "elysia";

const app = new Elysia()
  .use(
    cors({
      origin: [Bun.env.WEB_URL ?? "http://localhost:3000"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(
    openapi({
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .use(userPlugin)
  .use(emailPlugin);

app.listen(process.env.PORT ?? 3333);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
