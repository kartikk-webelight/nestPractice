import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { QUEUES } from "constants/queues";

@Injectable()
export class EmailQueue {
  constructor(@InjectQueue(QUEUES.EMAIL) private readonly queue: Queue) {}

  async enqueueVerification(email: string, userId: string, name: string) {
    return this.queue.add(
      "verify-email",
      { email, name, userId },
      { attempts: 5, backoff: { type: "exponential", delay: 3000 }, removeOnComplete: true },
    );
  }
}
