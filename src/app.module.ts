import { Module } from "@nestjs/common";
import { UsersModule } from "./modules/users/users.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import { PostModule } from "./modules/post/post.module";

@Module({
  imports: [DatabaseModule, UsersModule, PostModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
