import { Queue } from "bullmq";
import type { Logger } from "pino";
import {
  EMAIL_JOB_OPTIONS,
  EMAIL_QUEUE_NAME,
  getRedisConnection,
} from "./email-queue.config";

/**
 * Email Queue Service
 *
 * Service to enqueue email jobs using BullMQ.
 * Maintains a single instance of the email queue.
 */
export class EmailQueueService {
  private queue: Queue;

  constructor(private readonly logger: Logger) {
    // Create email queue with Redis configuration
    this.queue = new Queue(EMAIL_QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: EMAIL_JOB_OPTIONS,
    });

    this.logger.info({
      msg: "Email queue initialized",
      queueName: EMAIL_QUEUE_NAME,
    });
  }

  /**
   * Add an email job to the queue
   *
   * @param jobType - Job type (e.g., "send-welcome-email")
   * @param data - Email data
   * @returns Created job ID
   */
  async addJob<T>(jobType: string, data: T): Promise<string> {
    try {
      const job = await this.queue.add(jobType, data);
      const jobId = job.id ?? `fallback-${Date.now()}`;

      this.logger.info({
        msg: "Email job added to queue",
        jobType,
        jobId,
      });

      return jobId;
    } catch (error) {
      this.logger.error({
        msg: "Failed to add email job to queue",
        jobType,
        error,
      });
      throw error;
    }
  }

  /**
   * Get queue instance (for Bull Board)
   */
  getQueue(): Queue {
    return this.queue;
  }
}
