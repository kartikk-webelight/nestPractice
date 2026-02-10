import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AttachmentEntity } from "modules/attachment/attachment.entity";
import { AttachmentModule } from "modules/attachment/attachment.module";
import { AuthModule } from "modules/auth/auth.module";
import { UserEntity } from "modules/users/users.entity";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AttachmentEntity]), AuthModule, AttachmentModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
