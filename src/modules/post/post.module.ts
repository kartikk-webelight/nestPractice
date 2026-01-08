import { Module } from "@nestjs/common";
import { PostController } from "./post.controller";
import { PostService } from "./post.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostEntity } from "./post.entity";
import { UsersModule } from "../users/users.module";
import { UserEntity } from "../users/users.entity";
import { AuthHelperModule } from "../auth/auth.module";
import { AuthGuard } from "src/guards/auth-guard";
import { RolesGuard } from "src/guards/role-guard";

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, UserEntity]), UsersModule, AuthHelperModule],
  controllers: [PostController],
  providers: [PostService, AuthGuard, RolesGuard],
  exports: [TypeOrmModule.forFeature([PostEntity]), PostService],
})
export class PostModule {}
