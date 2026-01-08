import { Module } from "@nestjs/common";
import Redis from "ioredis";
import { redisConfig } from "src/config/redis-config";


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
