import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CloudinaryService } from "shared/cloudinary/cloudinary.service";
import { AttachmentEntity } from "./attachment.entity";
import { AttachmentService } from "./attachment.service";

@Module({
  imports: [TypeOrmModule.forFeature([AttachmentEntity])],
  providers: [AttachmentService, CloudinaryService],
})
export class AttachmentModule {}
