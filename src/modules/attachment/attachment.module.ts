import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AttachmentEntity } from "./attachment.entity";
import { AttachmentService } from "./attachment.service";

@Module({
  imports: [TypeOrmModule.forFeature([AttachmentEntity])],
  providers: [AttachmentService],
  exports: [AttachmentService],
})
export class AttachmentModule {}
