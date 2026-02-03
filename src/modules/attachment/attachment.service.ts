import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UploadApiResponse } from "cloudinary";
import { EntityManager, In, Repository } from "typeorm";
import { ERROR_MESSAGES } from "constants/messages";
import { EntityType } from "enums";
import { logger } from "services/logger.service";
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
    logger.info("Initiating single file upload for Entity: %s (ID: %s)", entityType, externalId);

    // Step 1: Upload file to Cloudinary and sync metadata with the database

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
    } catch (error) {
      logger.error("Upload failed for %s. Reason: %s", externalId, error.message);

      // Step 2: Critical cleanup - Remove orphan file from Cloudinary on DB failure

      if (uploadedResult?.public_id) {
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
    logger.info("Initiating batch upload of %d files for Entity: %s", files.length, externalId);

    // Step 1: Bulk upload to cloud and prepare database batch insertion

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
    } catch (error) {
      logger.error("Batch upload failed for ID %s. Error: %s", externalId, error.message);

      // Step 2: Rollback - delete all successfully uploaded files if batch sync fails

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
    // Step 1: Query all attachments for multiple parent IDs in a single batch

    logger.debug("Fetching attachments for %d IDs (Type: %s)", externalIds.length, entityType);

    if (!externalIds?.length) return {};

    const attachments = await this.attachmentRepository.find({
      where: {
        entityType,
        externalId: In(externalIds),
      },
    });
    const attachmentMap: Record<string, AttachmentEntity[]> = {};

    // Step 2: Group flat database results into an object map by externalId
    for (const attachment of attachments) {
      attachmentMap[attachment.externalId] ??= [];
      attachmentMap[attachment.externalId].push(attachment);
    }

    logger.debug("Successfully mapped %d attachments to parent entities", attachments.length);

    return attachmentMap;
  }
}
