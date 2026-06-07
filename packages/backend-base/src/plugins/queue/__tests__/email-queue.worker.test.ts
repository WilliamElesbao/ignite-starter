import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the env module
vi.mock("../../../env", () => ({
  env: {
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    WEB_URL: "http://localhost:3000",
    GOOGLE_CLIENT_ID: "test-google-client-id",
    GOOGLE_CLIENT_SECRET: "test-google-client-secret",
    STRIPE_SECRET_KEY: "sk_test_mock",
    STRIPE_WEBHOOK_SECRET: "whsec_test_mock",
  },
}));

// Mock resend module
vi.mock("../../../lib/resend", () => ({
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
}));

// Mock BullMQ Worker
vi.mock("bullmq", () => {
  class MockWorker {
    private eventHandlers: Record<string, ((...args: unknown[]) => void)[]> =
      {};
    public readonly queueName: string;
    public readonly processor: (job: unknown) => Promise<void> | void;
    public readonly options?: Record<string, unknown>;

    constructor(
      queueName: string,
      processor: (job: unknown) => Promise<void> | void,
      options?: Record<string, unknown>,
    ) {
      this.queueName = queueName;
      this.processor = processor;
      this.options = options;
    }

    on(event: string, handler: (...args: unknown[]) => void): this {
      if (!this.eventHandlers[event]) {
        this.eventHandlers[event] = [];
      }
      this.eventHandlers[event].push(handler);
      return this;
    }

    async close(): Promise<void> {
      // Mock implementation
    }

    // Helper method for tests to trigger events
    triggerEvent(event: string, ...args: unknown[]): void {
      const handlers = this.eventHandlers[event] || [];
      for (const handler of handlers) {
        handler(...args);
      }
    }

    // Expose for testing
    getProcessor(): (job: unknown) => Promise<void> | void {
      return this.processor;
    }
  }

  return {
    Worker: MockWorker,
  };
});

// Mock the queue config
vi.mock("../email-queue.config", () => ({
  EMAIL_QUEUE_NAME: "email",
  EMAIL_JOBS: {
    SEND_WELCOME: "send-welcome-email",
  },
  getRedisConnection: vi.fn(() => ({
    host: "localhost",
    port: 6379,
    password: undefined,
  })),
  EMAIL_JOB_OPTIONS: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      age: 86400,
      count: 1000,
    },
    removeOnFail: {
      age: 604800,
    },
  },
}));

import type { Job } from "bullmq";
import { Worker } from "bullmq";
import { createMockLogger } from "../../../test/setup";
import { EmailService } from "../../email/email.service";
import { EMAIL_JOBS, EMAIL_QUEUE_NAME } from "../email-queue.config";
import type { WelcomeEmailData } from "../email-queue.worker";
import { EmailQueueWorker } from "../email-queue.worker";

// Type for the mock worker with extended properties
interface MockWorkerExtensions {
  queueName: string;
  processor: (job: unknown) => Promise<void> | void;
  options?: Record<string, unknown>;
  triggerEvent: (event: string, ...args: unknown[]) => void;
  getProcessor: () => (job: unknown) => Promise<void> | void;
}

type MockWorker = Worker & MockWorkerExtensions;

describe("EmailQueueWorker", () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let sendWelcomeEmailMock: ReturnType<typeof vi.spyOn>;
  let emailQueueWorker: EmailQueueWorker;

  beforeEach(() => {
    // Create mock logger
    mockLogger = createMockLogger();

    sendWelcomeEmailMock = vi
      .spyOn(EmailService.prototype, "sendWelcomeEmail")
      .mockResolvedValue({ id: "email-mock" });

    // Create worker instance
    emailQueueWorker = new EmailQueueWorker(mockLogger);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("start", () => {
    it("should create worker with correct configuration", async () => {
      await emailQueueWorker.start();

      // Worker should be created (checking via instance)
      const worker = (emailQueueWorker as unknown as { worker: MockWorker })
        .worker;
      expect(worker).toBeInstanceOf(Worker);
      expect(worker.queueName).toBe(EMAIL_QUEUE_NAME);
      expect(worker.options).toMatchObject({
        connection: expect.objectContaining({
          maxRetriesPerRequest: null,
        }),
        concurrency: 5,
      });
    });

    it("should register completed event handler", async () => {
      await emailQueueWorker.start();

      const worker = (emailQueueWorker as unknown as { worker: MockWorker })
        .worker;
      const onSpy = vi.spyOn(worker, "on");

      // The on() calls happen in the constructor, so we need to check if handlers exist
      // by triggering an event
      worker.triggerEvent("completed", { id: "test-job", name: "test" });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: "Email job completed",
        }),
      );

      onSpy.mockRestore();
    });

    it("should register failed event handler", async () => {
      await emailQueueWorker.start();

      const worker = (emailQueueWorker as unknown as { worker: MockWorker })
        .worker;

      // Trigger failed event
      worker.triggerEvent(
        "failed",
        { id: "test-job", name: "test" },
        new Error("Test"),
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: "Email job failed",
        }),
      );
    });

    it("should log worker started message", async () => {
      await emailQueueWorker.start();

      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Email worker started",
        queueName: EMAIL_QUEUE_NAME,
      });
    });

    it("should emit completed event on success", async () => {
      await emailQueueWorker.start();

      const mockJob = {
        id: "job-123",
        name: EMAIL_JOBS.SEND_WELCOME,
      };

      const worker = (emailQueueWorker as unknown as { worker: MockWorker })
        .worker;
      worker.triggerEvent("completed", mockJob);

      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Email job completed",
        jobId: "job-123",
        jobType: EMAIL_JOBS.SEND_WELCOME,
      });
    });

    it("should emit failed event on error", async () => {
      await emailQueueWorker.start();

      const mockJob = {
        id: "job-456",
        name: EMAIL_JOBS.SEND_WELCOME,
      };
      const mockError = new Error("Email send failed");

      const worker = (emailQueueWorker as unknown as { worker: MockWorker })
        .worker;
      worker.triggerEvent("failed", mockJob, mockError);

      expect(mockLogger.error).toHaveBeenCalledWith({
        msg: "Email job failed",
        jobId: "job-456",
        jobType: EMAIL_JOBS.SEND_WELCOME,
        error: "Email send failed",
      });
    });
  });

  describe("stop", () => {
    it("should close worker gracefully", async () => {
      await emailQueueWorker.start();

      const worker = (emailQueueWorker as unknown as { worker: MockWorker })
        .worker;
      const closeSpy = vi.spyOn(worker, "close");

      await emailQueueWorker.stop();

      expect(closeSpy).toHaveBeenCalled();
      closeSpy.mockRestore();
    });

    it("should log worker stopped message", async () => {
      await emailQueueWorker.start();
      await emailQueueWorker.stop();

      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Email worker stopped",
      });
    });

    it("should handle stop when worker is not started", async () => {
      await emailQueueWorker.stop();

      // Should not throw and should not log stopped message
      expect(mockLogger.info).not.toHaveBeenCalledWith({
        msg: "Email worker stopped",
      });
    });
  });

  describe("processJob", () => {
    let processorFunction: (job: unknown) => Promise<void> | void;

    beforeEach(async () => {
      await emailQueueWorker.start();
      const worker = (emailQueueWorker as unknown as { worker: MockWorker })
        .worker;
      processorFunction = worker.getProcessor();
    });

    it("should process send-welcome-email job type correctly", async () => {
      const mockJob: Partial<Job<WelcomeEmailData>> = {
        id: "job-welcome-123",
        name: EMAIL_JOBS.SEND_WELCOME,
        data: {
          userId: "user-123",
          email: "test@example.com",
        },
        updateProgress: vi.fn().mockResolvedValue(undefined),
      };

      sendWelcomeEmailMock.mockResolvedValue({ id: "email-123" });

      await processorFunction(mockJob);

      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Processing email job",
        jobId: "job-welcome-123",
        jobType: EMAIL_JOBS.SEND_WELCOME,
      });
    });

    it("should call EmailService.sendWelcomeEmail during processing", async () => {
      const mockJob: Partial<Job<WelcomeEmailData>> = {
        id: "job-service-123",
        name: EMAIL_JOBS.SEND_WELCOME,
        data: {
          userId: "user-456",
          email: "service@example.com",
        },
        updateProgress: vi.fn().mockResolvedValue(undefined),
      };

      sendWelcomeEmailMock.mockResolvedValue({ id: "email-456" });

      await processorFunction(mockJob);

      expect(sendWelcomeEmailMock).toHaveBeenCalled();
    });

    it("should update job progress to 25%, 50%, 75%, 100%", async () => {
      const mockUpdateProgress = vi.fn().mockResolvedValue(undefined);
      const mockJob: Partial<Job<WelcomeEmailData>> = {
        id: "job-progress-123",
        name: EMAIL_JOBS.SEND_WELCOME,
        data: {
          userId: "user-progress",
          email: "progress@example.com",
        },
        updateProgress: mockUpdateProgress,
      };

      sendWelcomeEmailMock.mockResolvedValue({
        id: "email-progress",
      });

      await processorFunction(mockJob);

      expect(mockUpdateProgress).toHaveBeenCalledWith(25);
      expect(mockUpdateProgress).toHaveBeenCalledWith(50);
      expect(mockUpdateProgress).toHaveBeenCalledWith(75);
      expect(mockUpdateProgress).toHaveBeenCalledWith(100);
      expect(mockUpdateProgress).toHaveBeenCalledTimes(4);
    });

    it("should log success on completion", async () => {
      const mockJob: Partial<Job<WelcomeEmailData>> = {
        id: "job-success-123",
        name: EMAIL_JOBS.SEND_WELCOME,
        data: {
          userId: "user-success",
          email: "success@example.com",
        },
        updateProgress: vi.fn().mockResolvedValue(undefined),
      };

      const mockEmailResult = { id: "email-success-123" };
      sendWelcomeEmailMock.mockResolvedValue(mockEmailResult);

      await processorFunction(mockJob);

      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Sending welcome email",
        jobId: "job-success-123",
        userId: "user-success",
        email: "success@example.com",
      });

      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Welcome email sent successfully",
        jobId: "job-success-123",
        userId: "user-success",
        emailId: "email-success-123",
      });
    });

    it("should log error and mark job as failed on EmailService error", async () => {
      const mockJob: Partial<Job<WelcomeEmailData>> = {
        id: "job-error-123",
        name: EMAIL_JOBS.SEND_WELCOME,
        data: {
          userId: "user-error",
          email: "error@example.com",
        },
        updateProgress: vi.fn().mockResolvedValue(undefined),
      };

      const mockError = new Error("Resend API error");
      sendWelcomeEmailMock.mockRejectedValue(mockError);

      await expect(processorFunction(mockJob)).rejects.toThrow(
        "Resend API error",
      );

      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Sending welcome email",
        jobId: "job-error-123",
        userId: "user-error",
        email: "error@example.com",
      });
    });

    it("should throw error for unknown job type", async () => {
      const mockJob: Partial<Job> = {
        id: "job-unknown-123",
        name: "unknown-job-type",
        data: {},
        updateProgress: vi.fn().mockResolvedValue(undefined),
      };

      await expect(processorFunction(mockJob)).rejects.toThrow(
        "Unknown job type: unknown-job-type",
      );

      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Processing email job",
        jobId: "job-unknown-123",
        jobType: "unknown-job-type",
      });
    });

    it("should handle job without email result", async () => {
      const mockJob: Partial<Job<WelcomeEmailData>> = {
        id: "job-no-result-123",
        name: EMAIL_JOBS.SEND_WELCOME,
        data: {
          userId: "user-no-result",
          email: "noresult@example.com",
        },
        updateProgress: vi.fn().mockResolvedValue(undefined),
      };

      sendWelcomeEmailMock.mockResolvedValue(null);

      await processorFunction(mockJob);

      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Welcome email sent successfully",
        jobId: "job-no-result-123",
        userId: "user-no-result",
        emailId: undefined,
      });
    });

    it("should handle progress update failures gracefully", async () => {
      const mockUpdateProgress = vi
        .fn()
        .mockResolvedValueOnce(undefined) // 25%
        .mockRejectedValueOnce(new Error("Progress update failed")) // 50%
        .mockResolvedValueOnce(undefined) // 75%
        .mockResolvedValueOnce(undefined); // 100%

      const mockJob: Partial<Job<WelcomeEmailData>> = {
        id: "job-progress-fail-123",
        name: EMAIL_JOBS.SEND_WELCOME,
        data: {
          userId: "user-progress-fail",
          email: "progressfail@example.com",
        },
        updateProgress: mockUpdateProgress,
      };

      sendWelcomeEmailMock.mockResolvedValue({
        id: "email-progress-fail",
      });

      // Should throw because progress update at 50% fails
      await expect(processorFunction(mockJob)).rejects.toThrow(
        "Progress update failed",
      );
    });
  });

  describe("worker lifecycle", () => {
    it("should start and stop gracefully", async () => {
      await emailQueueWorker.start();

      const worker = (emailQueueWorker as unknown as { worker: MockWorker })
        .worker;
      expect(worker).toBeInstanceOf(Worker);
      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Email worker started",
        queueName: EMAIL_QUEUE_NAME,
      });

      await emailQueueWorker.stop();

      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Email worker stopped",
      });
    });

    it("should handle multiple start calls", async () => {
      await emailQueueWorker.start();
      await emailQueueWorker.start();

      // Logger should be called twice for started message
      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Email worker started",
        queueName: EMAIL_QUEUE_NAME,
      });
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });

    it("should handle stop without start", async () => {
      await emailQueueWorker.stop();

      expect(mockLogger.info).not.toHaveBeenCalledWith({
        msg: "Email worker stopped",
      });
    });
  });

  describe("event handlers", () => {
    beforeEach(async () => {
      await emailQueueWorker.start();
    });

    it("should handle completed event with job details", async () => {
      const mockJob = {
        id: "job-completed-123",
        name: EMAIL_JOBS.SEND_WELCOME,
      };

      const worker = (emailQueueWorker as unknown as { worker: MockWorker })
        .worker;
      worker.triggerEvent("completed", mockJob);

      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Email job completed",
        jobId: "job-completed-123",
        jobType: EMAIL_JOBS.SEND_WELCOME,
      });
    });

    it("should handle failed event with error details", async () => {
      const mockJob = {
        id: "job-failed-123",
        name: EMAIL_JOBS.SEND_WELCOME,
      };
      const mockError = new Error("Network timeout");

      const worker = (emailQueueWorker as unknown as { worker: MockWorker })
        .worker;
      worker.triggerEvent("failed", mockJob, mockError);

      expect(mockLogger.error).toHaveBeenCalledWith({
        msg: "Email job failed",
        jobId: "job-failed-123",
        jobType: EMAIL_JOBS.SEND_WELCOME,
        error: "Network timeout",
      });
    });

    it("should handle failed event with undefined job", async () => {
      const mockError = new Error("Unknown error");

      const worker = (emailQueueWorker as unknown as { worker: MockWorker })
        .worker;
      worker.triggerEvent("failed", undefined, mockError);

      expect(mockLogger.error).toHaveBeenCalledWith({
        msg: "Email job failed",
        jobId: undefined,
        jobType: undefined,
        error: "Unknown error",
      });
    });
  });
});
