import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MailerModule } from "@nestjs-modules/mailer";
import Redis from "ioredis";
import { mailerConfig } from "config/email.config";
import { redisConfig } from "config/redis-config";
import { CategoryEntity } from "modules/category/category.entity";
import { CommentEntity } from "modules/comments/comment.entity";
import { PostEntity } from "modules/post/post.entity";
import { ReactionEntity } from "modules/reaction/reaction.entity";
import { RoleEntity } from "modules/role/role.entity";
import { UserEntity } from "modules/users/users.entity";
import { QUEUES } from "constants/queues";
import { CacheService } from "./cache/cache.service";
import { CloudinaryService } from "./cloudinary/cloudinary.service";
import { CronService } from "./cron/cron.service";
import { EmailQueue } from "./email/email.queue";
import { EmailService } from "./email/email.service";
import { EmailProcessor } from "./email/email.worker";
import { SlugService } from "./slug.service";

@Global()
@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUES.EMAIL }),
    MailerModule.forRootAsync({
      useFactory: async () => mailerConfig,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([UserEntity, RoleEntity, CategoryEntity, PostEntity, ReactionEntity, CommentEntity]),
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
    CronService,
  ],
  exports: [CloudinaryService, SlugService, CacheService, EmailService, EmailQueue],
})
export class SharedModule {}
