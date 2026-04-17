#!/usr/bin/env bun

/**
 * Email Worker - Standalone Process
 *
 * Independent worker to process email jobs from the BullMQ queue.
 * Can be run separately from the API for better isolation and scalability.
 *
 * Usage:
 *   bun run packages/backend-base/src/workers/email.worker.ts
 *
 * Or via npm script:
 *   bun run worker:email
 */

import { logger } from "../lib/logger";
import { EmailQueueWorker } from "../plugins/queue";

// Create and start the worker
const worker = new EmailQueueWorker(logger);

await worker.start();

logger.info({
  msg: "Email worker process started",
  pid: process.pid,
});

// Graceful shutdown
const shutdown = async () => {
  logger.info({ msg: "Shutting down email worker..." });
  await worker.stop();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
