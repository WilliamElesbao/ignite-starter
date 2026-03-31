import { cors } from "@elysiajs/cors";
import { db as Database } from "@repo/db";
import { Elysia } from "elysia";
import { logger } from "../lib/logger";
import { stripe } from "../lib/stripe";
import { EventService } from "../services/event.service";
import { SHARED_ERROR_MAP, SharedErrorCode } from "./errors/shared.errors";
import { toErrorResponse } from "./errors/to-error-response";
import redisClient from "./redis.client";

export type cache = typeof redisClient;

export type db = typeof Database;

export type appLogger = typeof logger;

const eventService = new EventService(Database, logger);

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
  .state("cache", redisClient)
  .state("stripe", stripe)
  .state("logger", logger)
  .state("eventService", eventService)
  .onError(({ code, error, set, path, request }) => {
    logger.error({
      msg: "Unhandled error",
      code,
      path,
      method: request.method,
      error,
    });

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
  logger.info({ msg: "Stopping shared plugin" });
  Database.$client.end();
  redisClient.disconnect();
});

export default setup;
