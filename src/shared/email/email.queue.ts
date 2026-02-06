import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { QUEUE_OPTIONS } from "constants/queue-options";
import { EMAIL_JOBS, QUEUES } from "constants/queues";

@Injectable()
export class EmailQueue {
  constructor(@InjectQueue(QUEUES.EMAIL) private readonly queue: Queue) {}

  async enqueueVerification(email: string, userId: string, name: string) {
    return this.queue.add(EMAIL_JOBS.VERIFY, { email, name, userId }, QUEUE_OPTIONS.DEFAULT_RETRY);
  }
}
