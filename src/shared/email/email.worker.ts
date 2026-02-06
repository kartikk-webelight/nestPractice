import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";
import { QUEUES } from "constants/queues";
import { logger } from "services/logger.service";
import { EmailService } from "./email.service";

@Processor(QUEUES.EMAIL)
@Injectable()
export class EmailProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { email, userId, name } = job.data;

    logger.info("Processing verification email job. jobId=%s userId=%s email=%s", job.id, userId, email);

    try {
      await this.emailService.sendVerificationEmail(email, userId, name);
      logger.info("Verification email sent successfully. jobId=%s userId=%s email=%s", job.id, userId, email);
    } catch (error) {
      logger.error("Verification email job failed. jobId=%s userId=%s email=%s error=%o", job.id, userId, email, error);
      throw error; // Keep the original exception so BullMQ can retry
    }
  }
}
