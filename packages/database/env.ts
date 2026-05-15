import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url().startsWith("postgresql://"),
});

// Use process.env for compatibility with both Bun and Node.js (vitest)
const envSource = typeof Bun !== "undefined" ? Bun.env : process.env;
export const env = envSchema.parse(envSource);
