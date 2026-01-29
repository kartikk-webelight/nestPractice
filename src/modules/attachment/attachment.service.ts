import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UploadApiResponse } from "cloudinary";
import { EntityManager, In, Repository } from "typeorm";
import { ERROR_MESSAGES } from "constants/messages";
import { EntityType } from "enums";
import { CloudinaryService } from "shared/cloudinary/cloudinary.service";
import { AttachmentEntity } from "./attachment.entity";

/**
 * Performs file upload to cloud storage and persists metadata to the database.
 * * @remarks
 * Handles the logic for interacting with Cloudinary and ensuring database records
 * stay in sync with cloud storage, including cleanup on failure.
 * * @group File Management
 */
@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Performs file upload to cloud storage and persists metadata to the database.
   *
   * @param file - The raw file from Multer.
   * @param externalId - The ID of the parent entity (e.g., User ID or Post ID).
   * @param entityType - The category of the entity from {@link EntityType}.
   * @param manager - Optional {@link EntityManager} for database transactions.
   * @returns A promise resolving to the saved {@link AttachmentEntity}.
   * @throws ServiceUnavailableException if the upload fails or storage is unreachable.
   */
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
      if (uploadedResult && uploadedResult.public_id) {
        await this.cloudinaryService.deleteFromCloudinary(uploadedResult.public_id);
      }
      throw new ServiceUnavailableException(ERROR_MESSAGES.UPLOAD_FAILED_RETRY);
    }
  }

  /**
   * Executes a batch upload of multiple files and persists their metadata.
   *
   * @param files - An array of raw files for bulk processing.
   * @param externalId - The identifier for the parent entity.
   * @param entityType - The category of the resource from {@link EntityType}.
   * @param manager - Optional {@link EntityManager} to ensure batch consistency.
   * @returns An array of the saved {@link AttachmentEntity} objects.
   * @throws ServiceUnavailableException if any part of the batch process fails.
   */
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

  /**
   * Retrieves and maps attachments to their corresponding parent entity identifiers.
   *
   * @param postIds - A collection of IDs to query.
   * @param entityType - The specific {@link EntityType} to filter by.
   * @returns A {@link Record} mapping external IDs to their associated {@link AttachmentEntity} arrays.
   */
  async getAttachmentsByEntityIds(externalIds: string[], entityType: EntityType) {
    const attachments = await this.attachmentRepository.find({
      where: {
        entityType,
        externalId: In(externalIds),
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
