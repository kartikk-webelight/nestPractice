import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserEntity } from "modules/users/users.entity";
import { AuthController } from "./auth.controller";
import { AuthHelperService } from "./auth.helper.service";
import { AuthService } from "./auth.service";
import { AttachmentEntity } from "modules/attachment/attachment.entity";
import { AttachmentService } from "modules/attachment/attachment.service";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AttachmentEntity])],
  providers: [AuthHelperService, AuthService, AttachmentService],
  exports: [AuthHelperService],
  controllers: [AuthController],
})
export class AuthModule {}
