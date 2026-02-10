import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository } from "typeorm";
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

  @Cron(CronExpression.EVERY_WEEK)
  async handleAttachmentCleanup(): Promise<void> {
    try {
      const cutoffDate = getDateThirtyDaysAgo();
      const batchSize = CRON_LIMITS.ATTACHMENT_CLEANUP.BATCH_SIZE;

      // 1. Get the total number of items to process once
      const totalToProcess = await this.attachmentRepository.count({
        where: { deletedAt: LessThan(cutoffDate) },
        withDeleted: true,
      });
      let offset = 0;
      let processedSoFar = 0;

      logger.info("Starting cleanup. Total items: %d", totalToProcess);

      // 2.  move the offset forward until it hits the total
      while (processedSoFar < totalToProcess) {
        const batch = await this.attachmentRepository.find({
          where: { deletedAt: LessThan(cutoffDate) },
          withDeleted: true,
          order: { id: OrderBy.ASC },
          skip: offset,
          take: batchSize,
        });

        // Safety check: if no data is returned, we're done
        if (batch.length === 0) {
          break;
        }

        const results = await Promise.allSettled(batch.map((a) => this.cloudinaryService.deleteFromCloudinary(a.path)));

        const succeededIds = results
          .map((res, index) => (res.status === "fulfilled" ? batch[index].id : null))
          .filter((id): id is string => id !== null);

        if (succeededIds.length > 0) {
          const deleteResult = await this.attachmentRepository.delete(succeededIds);
          logger.info("%d records deleted", deleteResult.affected);
        }

        /**
         * If we deleted everything, offset stays the same (next records slide up).
         * If some failed, we must increase the offset to skip them.
         */
        const failedCount = batch.length - succeededIds.length;

        offset += failedCount;

        processedSoFar += batch.length;
      }

      logger.info("Cleanup process finished.");
    } catch (error) {
      logger.error("Cleanup failed: %s", error);
    }
  }
}
