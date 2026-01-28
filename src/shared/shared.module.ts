import { Global, Module } from "@nestjs/common";
import Redis from "ioredis";
import { redisConfig } from "config/redis-config";
import { CloudinaryService } from "./cloudinary/cloudinary.service";
import { EmailService } from "./email/email.service";
import { RedisService } from "./redis/redis.service";
import { SlugService } from "./slug.service";

@Global()
@Module({
  providers: [
    CloudinaryService,
    SlugService,
    EmailService,
    RedisService,
    {
      provide: "REDIS_CLIENT",
      useFactory: () => {
        return new Redis(redisConfig);
      },
    },
  ],
  exports: [CloudinaryService, SlugService, RedisService, EmailService],
})
export class SharedModule {}
