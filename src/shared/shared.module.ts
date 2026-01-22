import { Global, Module } from "@nestjs/common";
import Redis from "ioredis";
import { redisConfig } from "config/redis-config";
import { CloudinaryService } from "./cloudinary/cloudinary.service";
import { RedisService } from "./redis/redis.service";
import { SlugService } from "./slug.service";

@Global()
@Module({
  providers: [
    CloudinaryService,
    SlugService,
    RedisService,
    {
      provide: "REDIS_CLIENT",
      useFactory: () => {
        return new Redis(redisConfig);
      },
    },
  ],
  exports: [CloudinaryService, SlugService, RedisService],
})
export class SharedModule {}
