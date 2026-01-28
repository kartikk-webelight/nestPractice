import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AttachmentEntity } from "modules/attachment/attachment.entity";
import { AttachmentService } from "modules/attachment/attachment.service";
import { UserEntity } from "modules/users/users.entity";
import { CloudinaryService } from "shared/cloudinary/cloudinary.service";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AttachmentEntity])],
  controllers: [AdminController],
  providers: [AdminService, AttachmentService, CloudinaryService],
})
export class AdminModule {}
