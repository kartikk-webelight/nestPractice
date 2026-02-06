import { Inject, Injectable } from "@nestjs/common";
import { Redis } from "ioredis";

@Injectable()
export class CacheService {
  constructor(@Inject("REDIS_CLIENT") private readonly redis: Redis) {}

  async set(key: string, value: string, expirationTime: number) {
    return this.redis.set(key, value, "EX", expirationTime);
  }

  async setWithoutExpire(key: string, value: string) {
    return this.redis.set(key, value);
  }

  async get(key: string) {
    return this.redis.get(key);
  }

  async exists(keys: string[]) {
    return this.redis.exists(...keys);
  }

  async keys(pattern: string) {
    return this.redis.keys(pattern);
  }

  async delete(keys: string[]) {
    return this.redis.del(...keys);
  }

  async deleteByPattern(pattern: string) {
    let cursor = "0";

    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", 100);

      cursor = nextCursor;

      if (keys.length) {
        await this.delete(keys);
      }
    } while (cursor !== "0");
  }

  async hSet(key: string, label: string, value: string) {
    return this.redis.hset(key, { [label]: value });
  }

  async hDel(key: string, label: string) {
    return this.redis.hdel(key, label);
  }

  async hGet(key: string, label: string) {
    return this.redis.hget(key, label);
  }

  async zAdd(key: string, score: number, name: string, options = "INCR") {
    return this.redis.zadd(key, options, score, name);
  }

  async zScore(key: string, member: string) {
    return this.redis.zscore(key, member);
  }

  async zRange(key: string) {
    return this.redis.zrange(key, 0, -1);
  }

  async zCount(key: string) {
    return this.redis.zcount(key, "-inf", "+inf");
  }

  async zRem(key: string, members: string[]) {
    return this.redis.zrem(key, ...members);
  }

  async sAdd(key: string, val: string) {
    return this.redis.sadd(key, val);
  }

  async sRem(key: string, vals: string[]) {
    return this.redis.srem(key, ...vals);
  }

  async sMembers(key: string) {
    return this.redis.smembers(key);
  }

  async expire(key: string, time: number): Promise<number> {
    return this.redis.expire(key, time);
  }
}
