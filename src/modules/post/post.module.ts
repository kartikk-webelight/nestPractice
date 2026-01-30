import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AttachmentEntity } from "modules/attachment/attachment.entity";
import { AttachmentService } from "modules/attachment/attachment.service";
import { CategoryEntity } from "modules/category/category.entity";
import { UserEntity } from "modules/users/users.entity";
import { UsersModule } from "modules/users/users.module";
import { CloudinaryService } from "shared/cloudinary/cloudinary.service";
import { SlugService } from "shared/slug.service";
import { PostController } from "./post.controller";
import { PostEntity } from "./post.entity";
import { PostService } from "./post.service";

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, UserEntity, AttachmentEntity, CategoryEntity]), UsersModule],
  controllers: [PostController],
  providers: [PostService, SlugService, AttachmentService, CloudinaryService],
  exports: [TypeOrmModule.forFeature([PostEntity]), PostService],
})
export class PostModule {}
