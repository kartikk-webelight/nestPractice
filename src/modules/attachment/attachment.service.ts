import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { EntityType } from "enums";
import { CloudinaryService } from "shared/cloudinary/cloudinary.service";
import { AttachmentEntity } from "./attachment.entity";

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createAttachment(file: Express.Multer.File, externalId: string, entityType: EntityType) {
    const result = await this.cloudinaryService.uploadFileToCloudinary(file);
    const attachment = this.attachmentRepository.create({
      path: result.public_id,
      externalId,
      entityType,
      size: result.bytes,
      originalName: result.original_filename,
      mimeType: result.resource_type,
    });

    const savedAttachment = await this.attachmentRepository.save(attachment);

    return savedAttachment;
  }

  async createAttachments(files: Express.Multer.File[], externalId: string, entityType: EntityType) {
    const results = await this.cloudinaryService.uploadFilesToCloudinary(files);

    const attachments = results.map((result) => {
      return this.attachmentRepository.create({
        path: result.public_id,
        externalId,
        entityType,
        size: result.bytes,
        originalName: result.original_filename,
        mimeType: result.resource_type,
      });
    });

    const savedAttachments = await Promise.all(
      attachments.map((attachment) => this.attachmentRepository.save(attachment)),
    );

    return savedAttachments;
  }

  async getAttachmentsByEntityIds(postIds: string[], entityType: EntityType) {
    const attachments = await this.attachmentRepository.find({
      where: {
        entityType,
        externalId: In(postIds),
      },
    });
    const attachmentMap: Record<string, AttachmentEntity[]> = {};

    for (const attachment of attachments) {
      attachmentMap[attachment.externalId] ??= [];
      attachmentMap[attachment.externalId].push(attachment);
    }

    return attachmentMap;
  }
}
