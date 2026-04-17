import type { Job } from "bullmq";
import { Worker } from "bullmq";
import type { Logger } from "pino";
import { EmailService } from "../email/email.service";
import {
  EMAIL_JOBS,
  EMAIL_QUEUE_NAME,
  getRedisConnection,
} from "./email-queue.config";

/**
 * Welcome email job data
 */
export type WelcomeEmailData = {
  userId: string;
  email: string;
};

/**
 * Email Queue Worker
 *
 * Worker that processes email jobs from the BullMQ queue.
 * Can run in the same process as the API or as a separate process.
 */
export class EmailQueueWorker {
  private worker: Worker | null = null;

  constructor(private readonly logger: Logger) {}

  /**
   * Start the worker to process email jobs
   */
  async start(): Promise<void> {
    this.worker = new Worker(
      EMAIL_QUEUE_NAME,
      async (job: Job) => {
        return this.processJob(job);
      },
      {
        connection: {
          ...getRedisConnection(),
          maxRetriesPerRequest: null, // Workers need null for automatic reconnection
        },
        concurrency: 5, // Process up to 5 jobs simultaneously
      },
    );

    // Event listeners
    this.worker.on("completed", (job) => {
      this.logger.info({
        msg: "Email job completed",
        jobId: job.id,
        jobType: job.name,
      });
    });

    this.worker.on("failed", (job, error) => {
      this.logger.error({
        msg: "Email job failed",
        jobId: job?.id,
        jobType: job?.name,
        error: error.message,
      });
    });

    this.logger.info({
      msg: "Email worker started",
      queueName: EMAIL_QUEUE_NAME,
    });
  }

  /**
   * Stop the worker gracefully
   */
  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.logger.info({ msg: "Email worker stopped" });
    }
  }

  /**
   * Process an email job based on type
   */
  private async processJob(job: Job): Promise<void> {
    this.logger.info({
      msg: "Processing email job",
      jobId: job.id,
      jobType: job.name,
    });

    switch (job.name) {
      case EMAIL_JOBS.SEND_WELCOME:
        await this.sendWelcomeEmail(job);
        break;
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }

  /**
   * Send welcome email using EmailService
   */
  private async sendWelcomeEmail(job: Job<WelcomeEmailData>): Promise<void> {
    this.logger.info({
      msg: "Sending welcome email",
      jobId: job.id,
      userId: job.data.userId,
      email: job.data.email,
    });

    // Update progress
    await job.updateProgress(25);

    // Use EmailService to send the actual email
    const emailService = new EmailService(this.logger);

    await job.updateProgress(50);

    // Send welcome email
    const result = await emailService.sendWelcomeEmail();

    await job.updateProgress(75);

    this.logger.info({
      msg: "Welcome email sent successfully",
      jobId: job.id,
      userId: job.data.userId,
      emailId: result?.id,
    });

    await job.updateProgress(100);
  }
}
