import { Module } from "@nestjs/common";
import { AttachmentService } from "./attachment.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AttachmentEntity } from "./attachment.entity";
import { CloudinaryService } from "shared/cloudinary/cloudinary.service";

@Module({
  imports: [TypeOrmModule.forFeature([AttachmentEntity])],
  providers: [AttachmentService, CloudinaryService],
})
export class AttachmentModule {}
