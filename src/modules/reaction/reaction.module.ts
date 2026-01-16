import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CommentEntity } from "modules/comments/comment.entity";
import { PostEntity } from "modules/post/post.entity";
import { UserEntity } from "modules/users/users.entity";
import { AuthModule } from "modules/auth/auth.module";
import { AuthGuard } from "guards/auth-guard";
import { ReactionEntity } from "./reaction.entity";
import { ReactionController } from "./reaction.controller";
import { ReactionService } from "./reaction.service";

@Module({
  imports: [TypeOrmModule.forFeature([ReactionEntity, CommentEntity, PostEntity, UserEntity]), AuthModule],
  controllers: [ReactionController],
  providers: [ReactionService, AuthGuard],
})
export class ReactionModule {}
