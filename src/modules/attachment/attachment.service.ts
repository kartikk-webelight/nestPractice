import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UploadApiResponse } from "cloudinary";
import { EntityManager, In, Repository } from "typeorm";
import { ERROR_MESSAGES } from "constants/messages";
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

  async createAttachment(
    file: Express.Multer.File,
    externalId: string,
    entityType: EntityType,
    manager?: EntityManager,
  ) {
    const attachmentRepository = manager ? manager.getRepository(AttachmentEntity) : this.attachmentRepository;
    let uploadedResult: UploadApiResponse | null = null;

    try {
      uploadedResult = await this.cloudinaryService.uploadFileToCloudinary(file);
      const attachment = attachmentRepository.create({
        path: uploadedResult.public_id,
        externalId,
        entityType,
        size: uploadedResult.bytes,
        originalName: uploadedResult.original_filename,
        mimeType: uploadedResult.resource_type,
      });

      const savedAttachment = await attachmentRepository.save(attachment);

      return savedAttachment;
    } catch {
      if (uploadedResult?.public_id) {
        await this.cloudinaryService.deleteFromCloudinary(uploadedResult.public_id);
      }
      throw new ServiceUnavailableException(ERROR_MESSAGES.UPLOAD_FAILED_RETRY);
    }
  }

  async createAttachments(
    files: Express.Multer.File[],
    externalId: string,
    entityType: EntityType,
    manager?: EntityManager,
  ) {
    const attachmentRepository = manager ? manager.getRepository(AttachmentEntity) : this.attachmentRepository;
    let uploadedResults: UploadApiResponse[] = [];
    try {
      uploadedResults = await this.cloudinaryService.uploadFilesToCloudinary(files);

      const attachments = uploadedResults.map((result) => {
        return attachmentRepository.create({
          path: result.public_id,
          externalId,
          entityType,
          size: result.bytes,
          originalName: result.original_filename,
          mimeType: result.resource_type,
        });
      });

      const savedAttachments = await attachmentRepository.save(attachments);

      return savedAttachments;
    } catch {
      if (uploadedResults.length > 0) {
        await Promise.allSettled(
          uploadedResults.map((result) => this.cloudinaryService.deleteFromCloudinary(result.public_id)),
        );
      }
      throw new ServiceUnavailableException(ERROR_MESSAGES.UPLOAD_FAILED_RETRY);
    }
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
