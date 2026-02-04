import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { QUEUE_OPTIONS } from "constants/queue-options";
import { EMAIL_JOBS, QUEUES } from "constants/queues";
import { logger } from "services/logger.service";

@Injectable()
export class EmailQueue {
  constructor(@InjectQueue(QUEUES.EMAIL) private readonly queue: Queue) {}

  async enqueueVerification(email: string, userId: string, name: string) {
    logger.info("Adding verification email job to queue. userId=%s email=%s", userId, email);

    const job = await this.queue.add(EMAIL_JOBS.VERIFY, { email, name, userId }, QUEUE_OPTIONS.DEFAULT_RETRY);

    logger.info("Job added successfully. jobId=%s userId=%s email=%s", job.id, userId, email);

    return job;
  }
}
