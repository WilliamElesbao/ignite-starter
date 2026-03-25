import openapi from "@elysiajs/openapi";
import { emailPlugin, userPlugin } from "@repo/backend-base";
import { Elysia } from "elysia";

const app = new Elysia().use(userPlugin).use(emailPlugin).use(openapi());

app.listen(process.env.PORT ?? 4000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
