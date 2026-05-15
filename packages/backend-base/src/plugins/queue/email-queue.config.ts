/**
 * Email Queue Configuration
 *
 * Centralized configuration for email queue using BullMQ.
 */

export const EMAIL_QUEUE_NAME = "email" as const;

export const EMAIL_JOBS = {
  SEND_WELCOME: "send-welcome-email",
} as const;

/**
 * Redis connection configuration for BullMQ
 */
export function getRedisConnection() {
  const envSource = typeof Bun !== "undefined" ? Bun.env : process.env;
  const redisUrl = envSource.REDIS_URL ?? "redis://:abcd1234@localhost:6379";
  const url = new URL(redisUrl);

  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    password: url.password || undefined,
  };
}

/**
 * Default options for email jobs
 */
export const EMAIL_JOB_OPTIONS = {
  attempts: 5,
  backoff: {
    type: "exponential" as const,
    delay: 1000,
  },
  removeOnComplete: {
    age: 86400, // 24 hours
    count: 1000,
  },
  removeOnFail: {
    age: 604800, // 7 days
  },
};
