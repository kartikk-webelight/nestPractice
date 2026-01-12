import { Module } from "@nestjs/common";
import { AuthModule } from "modules/auth/auth.module";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import { AdminModule } from "./modules/admin/admin.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { PostModule } from "./modules/post/post.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [DatabaseModule, UsersModule, PostModule, AdminModule, CommentsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
