import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoryEntity } from "modules/category/category.entity";
import { CommentEntity } from "modules/comments/comment.entity";
import { PostEntity } from "modules/post/post.entity";
import { ReactionEntity } from "modules/reaction/reaction.entity";
import { RoleEntity } from "modules/role/role.entity";
import { UserEntity } from "modules/users/users.entity";
import { CronService } from "./cron.service";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([UserEntity, RoleEntity, CategoryEntity, PostEntity, ReactionEntity, CommentEntity]),
  ],
  providers: [CronService],
})
export class CronModule {}
