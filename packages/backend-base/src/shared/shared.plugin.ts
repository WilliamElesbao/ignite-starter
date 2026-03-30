import { cors } from "@elysiajs/cors";
import { db as Database } from "@repo/db";
import { Elysia } from "elysia";
import { stripe } from "../lib/stripe";
import { SHARED_ERROR_MAP, SharedErrorCode } from "./errors/shared.errors";
import { toErrorResponse } from "./errors/to-error-response";

export type db = typeof Database;

const setup = new Elysia({ name: "shared" })
  .use(
    cors({
      origin: [Bun.env.WEB_URL ?? "http://localhost:3000"],
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .state("db", Database)
  .state("stripe", stripe)
  .onError(({ code, error, set }) => {
    const response =
      code === "VALIDATION"
        ? toErrorResponse(error, {
            code: SharedErrorCode.REQUEST_VALIDATION_FAILED,
            catalog: SHARED_ERROR_MAP,
          })
        : toErrorResponse(error);

    set.status = response.status;
    return response.body;
  });

setup.onStop(() => {
  console.log("onStop on shared plugin");
  Database.$client.end();
});

export default setup;
