import z from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.url().startsWith("postgresql://"),
  // Redis
  REDIS_URL: z.string().startsWith("redis://"),
  // Web URL
  WEB_URL: z.url(),
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().endsWith(".apps.googleusercontent.com"),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  // Stripe
  STRIPE_API_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  // Whitelisted emails for testing purposes
  WHITELISTED_EMAILS: z.string().default(""),
});

// Use process.env for compatibility with both Bun and Node.js (vitest)
const envSource = typeof Bun !== "undefined" ? Bun.env : process.env;
export const env = envSchema.parse(envSource);
