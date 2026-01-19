import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CommentEntity } from "modules/comments/comment.entity";
import { PostEntity } from "modules/post/post.entity";
import { UserEntity } from "modules/users/users.entity";
import { ReactionController } from "./reaction.controller";
import { ReactionEntity } from "./reaction.entity";
import { ReactionService } from "./reaction.service";

@Module({
  imports: [TypeOrmModule.forFeature([ReactionEntity, CommentEntity, PostEntity, UserEntity])],
  controllers: [ReactionController],
  providers: [ReactionService],
})
export class ReactionModule {}
