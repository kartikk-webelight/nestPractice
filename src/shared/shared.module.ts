import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { MailerModule } from "@nestjs-modules/mailer";
import Redis from "ioredis";
import { mailerConfig } from "config/email.config";
import { redisConfig } from "config/redis-config";
import { QUEUES } from "constants/queues";
import { CloudinaryService } from "./cloudinary/cloudinary.service";
import { CronService } from "./cron/cron.service";
import { EmailQueue } from "./email/email.queue";
import { EmailService } from "./email/email.service";
import { EmailProcessor } from "./email/email.worker";
import { RedisService } from "./redis/redis.service";
import { SlugService } from "./slug.service";

@Global()
@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUES.EMAIL }),
    MailerModule.forRootAsync({
      useFactory: async () => mailerConfig,
    }),
    ScheduleModule.forRoot(),
  ],
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
    EmailQueue,
    EmailProcessor,
    CronService,
  ],
  exports: [CloudinaryService, SlugService, RedisService, EmailService, EmailQueue],
})
export class SharedModule {}
