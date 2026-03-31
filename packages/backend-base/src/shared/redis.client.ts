import ms, { type StringValue } from "ms";
import { createClient, type RedisClientType } from "redis";
import { logger } from "../lib/logger";

class RedisClient {
  private client: RedisClientType;

  constructor(redisUrl = "redis://:abcd1234@localhost:6379") {
    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.warn({
              msg: "Max Redis retry attempts reached",
              retries,
            });
            return false;
          }

          return Math.min(retries * 100, 3000); // exponential backoff strategy up to 3 seconds
        },
      },
    });

    this.client.on("error", (error) => {
      logger.error({ msg: "Redis client error", error });
    });

    this.client.on("connect", () => {
      logger.info({ msg: "Connected to Redis" });
    });

    this.client.on("reconnecting", () => {
      logger.warn({ msg: "Reconnecting to Redis" });
    });

    this.client.on("end", () => {
      logger.info({ msg: "Disconnected from Redis" });
    });
  }

  async connect() {
    if (!this.client.isOpen) {
      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Redis connection timeout")), 3000),
        );
        await Promise.race([this.client.connect(), timeout]);
      } catch (error) {
        logger.error({ msg: "Error connecting to Redis", error });
        throw error;
      }
    }
  }

  async disconnect() {
    if (this.client.isOpen) {
      try {
        this.client.destroy();
      } catch (error) {
        logger.error({ msg: "Error disconnecting from Redis", error });
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    await this.connect();

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }

      return null;
    } catch (error) {
      logger.error({ msg: "Error getting key from Redis", key, error });
      throw error;
    }
  }

  async set(
    key: string,
    value: string,
    ttl: StringValue,
  ): Promise<string | null> {
    await this.connect();

    try {
      return await this.client.set(key, JSON.stringify(value), {
        PX: ms(ttl),
      });
    } catch (error) {
      logger.error({ msg: "Error setting value in Redis", key, ttl, error });
      throw error;
    }
  }

  async delete(key: string): Promise<number> {
    await this.connect();

    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error({ msg: "Error deleting key from Redis", key, error });
      throw error;
    }
  }
}

const redisUrl = Bun.env.REDIS_URL ?? "redis://:abcd1234@localhost:6379";
const redisClient = new RedisClient(redisUrl);

export default redisClient;
