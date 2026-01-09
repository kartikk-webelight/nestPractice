import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthGuard } from "guards/auth-guard";
import { RolesGuard } from "guards/role-guard";

import { AuthModule } from "../auth/auth.module";
import { UserEntity } from "../users/users.entity";
import { UsersModule } from "../users/users.module";
import { PostController } from "./post.controller";
import { PostEntity } from "./post.entity";
import { PostService } from "./post.service";

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, UserEntity]), UsersModule, AuthModule],
  controllers: [PostController],
  providers: [PostService, AuthGuard, RolesGuard],
  exports: [TypeOrmModule.forFeature([PostEntity]), PostService],
})
export class PostModule {}
