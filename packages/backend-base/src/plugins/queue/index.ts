/**
 * Email Queue Module
 *
 * Simplified module for email queue management using BullMQ.
 *
 * Components:
 * - EmailQueueService: Service to add jobs to the queue
 * - EmailQueueWorker: Worker to process jobs from the queue
 * - bullBoardPlugin: UI to monitor the queue
 */

export type { BullBoardPlugin } from "./bull-board.plugin";
export { default as bullBoardPlugin } from "./bull-board.plugin";
export { EMAIL_JOBS, EMAIL_QUEUE_NAME } from "./email-queue.config";
export { EmailQueueService } from "./email-queue.service";
export type { WelcomeEmailData } from "./email-queue.worker";
export { EmailQueueWorker } from "./email-queue.worker";
