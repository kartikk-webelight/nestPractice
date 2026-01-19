import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AttachmentEntity } from "modules/attachment/attachment.entity";
import { AttachmentService } from "modules/attachment/attachment.service";
import { AuthModule } from "modules/auth/auth.module";
import { UserEntity } from "modules/users/users.entity";
import { AuthGuard } from "guards/auth-guard";
import { RolesGuard } from "guards/role-guard";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AttachmentEntity]), AuthModule],
  controllers: [AdminController],
  providers: [AdminService, AuthGuard, RolesGuard, AttachmentService],
})
export class AdminModule {}
