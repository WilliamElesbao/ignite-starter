import { cors } from "@elysiajs/cors";
import { db as Database } from "@repo/db";
import { Elysia } from "elysia";
import { stripe } from "../lib/stripe";

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
  .state("stripe", stripe);

setup.onStop(() => {
  console.log("onStop on shared plugin");
  Database.$client.end();
});

export default setup;
