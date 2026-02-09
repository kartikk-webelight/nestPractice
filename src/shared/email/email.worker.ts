import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";
import { EMAIL_JOBS, QUEUES } from "constants/queues";
import { logger } from "services/logger.service";
import { EmailService } from "./email.service";

@Processor(QUEUES.EMAIL)
@Injectable()
export class EmailProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { name: jobName, data } = job;
    const { email, userId, name } = data;

    logger.info("Processing %s for %s", jobName, email);

    try {
      switch (jobName) {
        case EMAIL_JOBS.VERIFY:
          await this.emailService.sendVerificationEmail(email, userId, name);
          break;

        case EMAIL_JOBS.DEACTIVATE:
          await this.emailService.sendAccountDeactivationEmail(email, name);
          break;

        default:
          logger.warn("No handler found for job: %s", jobName);

          return; // Exit if no match
      }

      logger.info("Successfully completed %s", jobName);
    } catch (error) {
      logger.error("%s failed for %s: %o", jobName, email, error);
      throw error; // Essential for BullMQ retries
    }
  }
}
