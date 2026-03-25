import { cors } from "@elysiajs/cors";
import { db as Database } from "@repo/database";
import { Elysia } from "elysia";

export type db = typeof Database;

const setup = new Elysia({ name: "shared" }).use(cors()).state("db", Database);

setup.onStop(() => {
  console.log("onStop on shared plugin");
  Database.$disconnect();
});

export default setup;
