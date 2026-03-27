import { defineConfig } from "drizzle-kit";
import { env } from "./env";

export default defineConfig({
  schema: "./src/schema/**",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  casing: "snake_case",
});
