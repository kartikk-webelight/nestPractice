import { Module } from "@nestjs/common";
import { redisConfig } from "config/redis-config";
import Redis from "ioredis";

@Module({
  providers: [
    {
      provide: "REDIS_CLIENT",
      useValue: new Redis({
        ...redisConfig,
      }),
    },
  ],
  exports: ["REDIS_CLIENT"],
})
export class RedisModule {}
