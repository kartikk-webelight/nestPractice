import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import Redis from "ioredis";
import { mailerConfig } from "config/email.config";
import { redisConfig } from "config/redis-config";
import { QUEUES } from "constants/queues";
import { CloudinaryService } from "./cloudinary/cloudinary.service";
import { EmailQueue } from "./email/email.queue";
import { EmailService } from "./email/email.service";
import { EmailProcessor } from "./email/email.worker";
import { CacheService } from "./redis/cache.service";
import { SlugService } from "./slug.service";

@Global()
@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUES.EMAIL }),
    MailerModule.forRootAsync({
      useFactory: async () => mailerConfig,
    }),
  ],
  providers: [
    CloudinaryService,
    SlugService,
    EmailService,
    CacheService,
    {
      provide: "REDIS_CLIENT",
      useFactory: () => {
        return new Redis(redisConfig);
      },
    },
    EmailQueue,
    EmailProcessor,
  ],
  exports: [CloudinaryService, SlugService, CacheService, EmailService, EmailQueue],
})
export class SharedModule {}
