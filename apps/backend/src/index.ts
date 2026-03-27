import openapi from "@elysiajs/openapi";
import { emailPlugin, OpenAPI, userPlugin } from "@repo/backend-base";
import { Elysia } from "elysia";

const app = new Elysia()
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
