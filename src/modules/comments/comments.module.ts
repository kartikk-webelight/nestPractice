import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostModule } from "modules/post/post.module";
import { UsersModule } from "modules/users/users.module";
import { CommentEntity } from "./comment.entity";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity]), UsersModule, PostModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
