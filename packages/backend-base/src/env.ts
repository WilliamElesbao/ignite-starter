import z from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url().startsWith("postgresql://"),
  REDIS_URL: z.string().startsWith("redis://"),
  WEB_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  STRIPE_API_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  // Whitelisted emails for testing purposes
  WHITELISTED_EMAILS: z.string().default(""),
});

// Use process.env for compatibility with both Bun and Node.js (vitest)
const envSource = typeof Bun !== "undefined" ? Bun.env : process.env;
export const env = envSchema.parse(envSource);
