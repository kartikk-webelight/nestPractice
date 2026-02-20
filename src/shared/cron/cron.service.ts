import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AttachmentEntity } from "modules/attachment/attachment.entity";
import { CRON_LIMITS } from "constants/cron";
import { OrderBy } from "enums";
import { logger } from "services/logger.service";
import { CloudinaryService } from "shared/cloudinary/cloudinary.service";
import { getDateThirtyDaysAgo } from "utils/helper";

@Injectable()
export class CronService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,

    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleAttachmentCleanup(): Promise<void> {
    try {
      const cutoffDate = getDateThirtyDaysAgo();
      const batchSize = CRON_LIMITS.ATTACHMENT_CLEANUP.BATCH_SIZE;

      // Step 1: Initialize reusable query and get total count
      const query = this.attachmentRepository
        .createQueryBuilder("attachment")
        .withDeleted()
        .where("attachment.deletedAt < :cutoffDate", { cutoffDate });

      const totalToProcess = await query.getCount();

      let offset = 0;
      let processedSoFar = 0;

      logger.info("Starting cleanup. Total items: %d", totalToProcess);

      while (offset < totalToProcess) {
        // Step 2: Fetch batch using cloned query to maintain offset isolation
        const batch = await query.orderBy("attachment.id", OrderBy.ASC).skip(offset).take(batchSize).getMany();

        if (batch.length === 0) break;

        const results = await Promise.allSettled(batch.map((a) => this.cloudinaryService.deleteFromCloudinary(a.path)));

        const succeededIds = results
          .map((res, index) => (res.status === "fulfilled" ? batch[index].id : null))
          .filter((id): id is string => id !== null);

        if (succeededIds.length > 0) {
          const deleted = await this.attachmentRepository.delete(succeededIds);

          const countFromDB = deleted.affected ?? 0;
          processedSoFar += countFromDB;

          logger.info(
            "Sync Details - Cloudinary deleted: %d, DB affected: %d. Total processed: %d/%d",
            succeededIds.length,
            countFromDB,
            processedSoFar,
            totalToProcess,
          );
        }
        // Step 3: Log failures and increment offset to move to the next page
        const failedCount = batch.length - succeededIds.length;

        if (failedCount > 0) {
          logger.warn("%d items failed to delete", failedCount);
        }

        offset += batchSize;
        processedSoFar += batch.length;
      }

      logger.info("Cleanup process finished.");
    } catch (error) {
      logger.error("Cleanup failed: %s", error instanceof Error ? error.message : error);
    }
  }
}
