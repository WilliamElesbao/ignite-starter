import { apiKey } from "@better-auth/api-key";
import { db } from "@repo/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { env } from "../../env";
import redisClient from "../../shared/redis.client";
import { logger } from "../logger";

export const auth = betterAuth({
  basePath: "/auth",
  trustedOrigins: [env.WEB_URL],
  logger: {
    disabled: false,
    disableColors: false,
    level: "warn",
    log: (level, message, ...args) => {
      const metadata = { msg: message, source: "better-auth", args };

      if (level === "error") {
        logger.error(metadata);
        return;
      }

      if (level === "warn") {
        logger.warn(metadata);
        return;
      }

      logger.info(metadata);
    },
  },
  plugins: [
    openAPI(),
    apiKey({
      storage: "secondary-storage",
      fallbackToDatabase: true,
    }),
  ],
  secondaryStorage: {
    get: async (key) => await redisClient.get(key),
    set: async (key, value, ttl) => {
      if (ttl) await redisClient.set(key, value, `${ttl}s`);
      else await redisClient.set(key, value, `${60 * 60 * 24}s`); // Default to 24 hours if no TTL is provided
    },
    delete: async (key) => {
      await redisClient.delete(key);
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  advanced: {
    database: {
      generateId: false,
    },
  },
  user: {
    additionalFields: {
      stripeSubscriptionId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieCache: {
      enabled: false,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    password: {
      hash: (password) => Bun.password.hash(password),
      verify: ({ password, hash }) => Bun.password.verify(password, hash),
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      accessType: "offline",
      prompt: "select_account",
    },
  },
});

export type SessionResponse = typeof auth.$Infer.Session;
