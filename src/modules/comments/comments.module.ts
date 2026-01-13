import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthGuard } from "guards/auth-guard";
import { RolesGuard } from "guards/role-guard";
import { AuthHelperService } from "modules/auth/auth.helper.service";
import { PostModule } from "modules/post/post.module";
import { UsersModule } from "modules/users/users.module";

import { CommentEntity } from "./comment.entity";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity]), UsersModule, PostModule],
  controllers: [CommentsController],
  providers: [CommentsService, AuthGuard, AuthHelperService, RolesGuard],
})
export class CommentsModule {}
