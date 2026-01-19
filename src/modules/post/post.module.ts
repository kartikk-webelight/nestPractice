import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SlugService } from "shared/slug.service";
import { AttachmentEntity } from "modules/attachment/attachment.entity";
import { AttachmentService } from "modules/attachment/attachment.service";
import { AuthModule } from "modules/auth/auth.module";
import { UserEntity } from "modules/users/users.entity";
import { UsersModule } from "modules/users/users.module";
import { AuthGuard } from "guards/auth-guard";
import { RolesGuard } from "guards/role-guard";
import { PostController } from "./post.controller";
import { PostEntity } from "./post.entity";
import { PostService } from "./post.service";

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, UserEntity, AttachmentEntity]), UsersModule, AuthModule],
  controllers: [PostController],
  providers: [PostService, AuthGuard, RolesGuard, SlugService, AttachmentService],
  exports: [TypeOrmModule.forFeature([PostEntity]), PostService],
})
export class PostModule {}
