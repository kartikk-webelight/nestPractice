import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthGuard } from "guards/auth-guard";
import { AuthModule } from "modules/auth/auth.module";
import { CommentEntity } from "modules/comments/comment.entity";
import { PostEntity } from "modules/post/post.entity";
import { UserEntity } from "modules/users/users.entity";

import { ReactionController } from "./reaction.controller";
import { ReactionEntity } from "./reaction.entity";
import { ReactionService } from "./reaction.service";

@Module({
  imports: [TypeOrmModule.forFeature([ReactionEntity, CommentEntity, PostEntity, UserEntity]), AuthModule],
  controllers: [ReactionController],
  providers: [ReactionService, AuthGuard],
})
export class ReactionModule {}
