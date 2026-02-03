import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";
import { QUEUES } from "constants/queues";
import { EmailService } from "./email.service";

@Processor(QUEUES.EMAIL)
@Injectable()
export class EmailProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }
  async process(job: Job): Promise<void> {
    const { email, userId, name } = job.data;
    await this.emailService.sendVerificationEmail(email, userId, name);
  }
}
