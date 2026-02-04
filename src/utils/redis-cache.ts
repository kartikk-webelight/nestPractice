import { logger } from "services/logger.service";
import { RedisService } from "shared/redis/redis.service";

/**
 * Fetches a value from Redis, parses it as JSON, and returns it.
 * If parsing fails, logs a warning, deletes the corrupted key, and returns null.
 *
 * @template T - The expected type of the cached value
 * @param redisCacheKey - Redis key to fetch
 * @param redisService - Instance of RedisService
 * @returns The parsed object of type T, or null if not found / invalid
 */
export const getCachedJson = async <T>(redisCacheKey: string, redisService: RedisService): Promise<T | null> => {
  const cachedValue = await redisService.get(redisCacheKey);

  if (!cachedValue) return null;

  try {
    return JSON.parse(cachedValue) as T;
  } catch (error) {
    logger.warn("Failed to parse Redis cache with key %s: %o", redisCacheKey, error);
    await redisService.delete([redisCacheKey]);

    return null;
  }
};

/**
 * Generates a stable Redis cache key from a string or object with a prefix.
 *
 * - Uses the string directly if `data` is a string.
 * - Sorts object keys alphabetically to ensure stable keys regardless of key order.
 *
 * @param prefix - Prefix for the Redis key (e.g., 'posts', 'user').
 * @param data - Object or string to generate the key from.
 * @returns A stable Redis key string.
 */
export const makeRedisKey = (prefix: string, data: object | string): string => {
  let keyPart: string;

  if (typeof data === "string") {
    keyPart = data;
  } else {
    keyPart = JSON.stringify(
      Object.keys(data)
        .sort((a, b) => a.localeCompare(b))
        .reduce(
          (acc, k) => {
            acc[k] = data[k];

            return acc;
          },
          {} as Record<string, any>,
        ),
    );
  }

  return `${prefix}:${keyPart}`;
};
