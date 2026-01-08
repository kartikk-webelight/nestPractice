import { Module } from "@nestjs/common";
import { UsersModule } from "./modules/users/users.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import { PostModule } from "./modules/post/post.module";
import { AdminModule } from './modules/admin/admin.module';
import { CommentsModule } from './modules/comments/comments.module';
import { VotesModule } from './modules/votes/votes.module';

@Module({
  imports: [DatabaseModule, UsersModule, PostModule, AdminModule, CommentsModule, VotesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
