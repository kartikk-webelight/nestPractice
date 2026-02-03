import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { bullConfig } from "config/bullMq.config";
import { AuthModule } from "modules/auth/auth.module";
import { SharedModule } from "shared/shared.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AttachmentModule } from "./modules/attachment/attachment.module";
import { CategoryModule } from "./modules/category/category.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { PostModule } from "./modules/post/post.module";
import { ReactionModule } from "./modules/reaction/reaction.module";
import { RoleModule } from "./modules/role/role.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: "default",
          ttl: 60000,
          limit: 100000,
        },
      ],
    }),
    BullModule.forRoot(bullConfig),
    DatabaseModule,
    UsersModule,
    PostModule,
    AdminModule,
    CommentsModule,
    AuthModule,
    SharedModule,
    ReactionModule,
    AttachmentModule,
    CategoryModule,
    RoleModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AppService,
  ],
})
export class AppModule {}
