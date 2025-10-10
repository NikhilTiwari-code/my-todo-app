import { Redis } from "ioredis";

let redis: Redis | null = null;

/**
 * Get Redis client instance (singleton)
 * Falls back gracefully if Redis is unavailable
 */
export function getRedisClient(): Redis | null {
  // Skip in development if no Redis
  if (process.env.SKIP_REDIS === "true") {
    console.log("[Redis] Skipped (SKIP_REDIS=true)");
    return null;
  }

  if (redis) return redis;

  try {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false, // Don't queue commands when offline
      retryStrategy(times) {
        // Stop retrying after 3 attempts
        if (times > 3) {
          console.log("[Redis] Max retries reached, disabling Redis");
          return null;
        }
        return Math.min(times * 100, 1000);
      },
      lazyConnect: true, // Don't connect immediately
    });

    let errorLogged = false;
    redis.on("error", (err) => {
      if (!errorLogged) {
        console.warn("[Redis] Connection failed - caching disabled:", err.message);
        errorLogged = true;
      }
    });

    redis.on("connect", () => {
      console.log("[Redis] Connected successfully");
      errorLogged = false;
    });

    return redis;
  } catch (error) {
    console.warn("[Redis] Failed to initialize - caching disabled", error);
    return null;
  }
}

/**
 * Cache helper functions
 */
export const cache = {
  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    if (!client) return null;

    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`[Redis] Get error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set cache value with TTL
   */
  async set(key: string, value: unknown, ttlSeconds: number = 300): Promise<boolean> {
    const client = getRedisClient();
    if (!client) return false;

    try {
      await client.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[Redis] Set error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Delete cache key(s)
   */
  async del(...keys: string[]): Promise<boolean> {
    const client = getRedisClient();
    if (!client) return false;

    try {
      await client.del(...keys);
      return true;
    } catch (error) {
      console.error(`[Redis] Delete error for keys ${keys.join(", ")}:`, error);
      return false;
    }
  },

  /**
   * Delete all keys matching pattern
   */
  async delPattern(pattern: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client) return false;

    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error(`[Redis] Delete pattern error for ${pattern}:`, error);
      return false;
    }
  },
};

/**
 * Cache key generators
 */
export const cacheKeys = {
  todosList: (userId: string, queryHash: string) => `todos:list:${userId}:${queryHash}`,
  todo: (todoId: string) => `todos:item:${todoId}`,
  userTodos: (userId: string) => `todos:user:${userId}:*`,
};
