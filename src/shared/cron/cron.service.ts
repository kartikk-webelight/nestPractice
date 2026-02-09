import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EntityManager, LessThan, DataSource } from "typeorm";
import { AttachmentEntity } from "modules/attachment/attachment.entity";
import { logger } from "services/logger.service";
import { CloudinaryService } from "shared/cloudinary/cloudinary.service";
import { thirtyDaysAgo } from "utils/helper";

@Injectable()
export class CronService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  async handleAttachmentCleanup(): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager: EntityManager) => {
        const cutoffDate = thirtyDaysAgo();
        logger.info("Starting attachment cleanup. Cutoff: %s", cutoffDate.toISOString());
        const attachmentRepository = manager.getRepository(AttachmentEntity);

        const attachments = await attachmentRepository.find({
          where: { deletedAt: LessThan(cutoffDate) },
          withDeleted: true,
        });

        if (attachments.length === 0) {
          logger.info("Cleanup finished: No attachments found to delete.");

          return;
        }

        // Hard delete from DB
        await attachmentRepository.delete({
          deletedAt: LessThan(cutoffDate),
        });

        // Clean up Cloudinary
        const results = await Promise.allSettled(
          attachments.map((a) => this.cloudinaryService.deleteFromCloudinary(a.path)),
        );

        const succeeded = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;

        logger.info(
          "Cleanup success. DB Records: %d | Cloudinary: %d deleted, %d failed",
          attachments.length,
          succeeded,
          failed,
        );
      });
    } catch (error) {
      logger.error("Cleanup failed. Error: %s", error instanceof Error ? error.stack : error);
    }
  }
}
