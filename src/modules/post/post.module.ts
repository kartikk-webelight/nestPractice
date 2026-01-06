import { Module } from "@nestjs/common";
import { PostController } from "./post.controller";
import { PostService } from "./post.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { postEntity } from "./post.entity";
import { UsersModule } from "../users/users.module";
import { UsersEntity } from "../users/users.entity";
import { AuthHelperModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([postEntity, UsersEntity]), UsersModule, AuthHelperModule],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
